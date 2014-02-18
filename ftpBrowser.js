var q=require('q');
var Client = require('ftp');
var util = require('util');
var pathUtil = require('path');
var fs = require('fs');
var http = require('http');
var gm = require('gm');
var throat = require('throat');
var settings = (require('./ftpBrowserSettings'))();
var logModule = require('./socketLogger');
var niceLog = function(data) {console.log(util.inspect(data, { depth: 4, colors:true }));};

var c = new Client();
var log = logModule.sendMsg;
var initP = logModule.initProgress;
var prog = logModule.incProgress;
c.on('error', function(err) {console.log(err);});

var connect = function(ftpSettings) {
    log('connecting to ftp');
    var deferred  = q.defer();
    c.connect(ftpSettings);
    c.on('ready', function(){
        log('ftp connected!');
        deferred.resolve();
    });
    c.on('error', function(err){
        log('ftp error '+err);
        deferred.reject(err);
    });
    c.on('end', function(){log('ftp disconnected...')});
    return deferred.promise;
};

var list = function(path) {return function() {
    var deferred  = q.defer();

    initP('list', 1);
    c.list(path, function(err, flist) {
        if (flist) {
            flist.forEach(function(i){
                delete i.owner;
                delete i.rights;
                delete i.target;
                delete i.group;
            });
        }
        var output = {path:path, list:flist ? flist : []};
        prog('list', list.length);
        deferred.resolve(output);
    });
    return deferred.promise;
    }
};

var filterJpegs = function(dirs) {
    var output = [];
    dirs.forEach(function(item) {
        var filtered={path:item.path,list:[]};
        item.list.forEach(function(listItem){
           var regex = /^[\w. ]*$/;
           if (listItem.type==='-'
               && pathUtil.extname(listItem.name).toLowerCase()==='.jpg'
               && listItem.name.substr(0,3).toLowerCase() !== 'tn_'
               && listItem.name.toLowerCase() !== 'vize_logo_render.jpg'
               && regex.test(listItem.name)
               ) {
               filtered.list.push(listItem);
           }
        });
        if (filtered.list.length>0) {output.push(filtered);}
    });
    return q(output);
};

var getDates = function(files) {
    var output = [];
    files.forEach(function(item) {
        var deferred = q.defer();
        var fileName = item.name;
        log('getting date for:' + item.name);
        c.lastMod(fileName, function(err, d) {
            if (err) {
                console.log(err);
                deferred.reject(err);
            }
            else {
                item.date = d;
                deferred.resolve(item);
            }
            });
        output.push(deferred.promise);
    });
    return q.all(output);
};

var reduceList = function(dirs) {
    var output = [];
    dirs.forEach(function(pathItem){
        var path = pathItem.path;
        pathItem.list.forEach(function(jpg){
            jpg.name = path + '/' + jpg.name;
            delete jpg.type;
            output.push(jpg);
        });
    });
    return q(output);
};

var sortByDate = function(filesList) {
  return q(filesList.sort(function(a,b){
      if(a.date > b.date) return -1;
      if(b.date < a.date) return 1;
      return 0;
  }));
};

var getProjectNameFromPath = function(path) {
    var rr = (path.match(/temp\/([\w\-. ]+)\/render\/[\w\-. \/]+\/([\w\-. ]+)/));
    return {
        project: rr[1],
        filename: rr[2]
        }
};

var downloadFile = function(item) {
    var deferred = q.defer();
    var dirData = getProjectNameFromPath(item.name);
    var newPath = pathUtil.join('./public/downloaded/', dirData.project);
    log('checking: '+item.name);
    item.fileName = pathUtil.basename(item.name);
    item.localPath = pathUtil.join('./public/downloaded/' , dirData.project , item.fileName);
    item.localURL = '/downloaded/' + dirData.project + '/' + item.fileName;
    item.localThumb = pathUtil.join('./public/downloaded/', dirData.project, ('/thumb_' + item.fileName));
    item.localThumbURL = '/downloaded/' + dirData.project + '/thumb_' + item.fileName;
    item.project = dirData.project;
    item.httpPath = 'http://' + settings.host + '/' + item.name;
    item.ftpPath = 'ftp://' + settings.host + '/' + item.name;

    fs.mkdir(newPath, function(){
        fs.exists(item.localPath, function(exists){
            prog('download');
            log('checking: ' + item.name);
            if (exists) {
                deferred.resolve(item);
            }
            else
            {
                log('downloading: ' + item.name);
                /*http.get(item.httpPath, function(response) {
                    response.pipe(file);
                });*/
                console.log(item.localPath);
                c.get(item.name, function(err, stream) {
                    if (err) {
                        console.log(item.name);
                        console.log(err);
                        deferred.reject(err);
                    }
                    else
                    {
                        stream.once('close', function() { deferred.resolve(item) });
                        stream.pipe(fs.createWriteStream(item.localPath));
                    }
                });
            }
        });
    });
    return deferred.promise;
};

var downloadNew = function(filesList) {
    initP('download', filesList.length);
    return q.all(filesList.map(throat(settings.downloadConcurrency, downloadFile)));
};

var resizeItem = function(item) {
    var deferred = q.defer();
    fs.exists(item.localThumb, function(exists){
        prog('thumbs');
        if (exists) {
            log('thumb exists: ' + item.localPath);
            deferred.resolve(item);
        }
        else
        {
            log('resizing: ' + item.localPath);
            gm(item.localPath)
                .resize(settings.thumbWidth)
                .write(item.localThumb , function(err){
                    if (err) {console.log(err);}
                    deferred.resolve(item);
                });
        }
    });
    return deferred.promise;
};

var createThumbs = function(filesList) {
    initP('thumbs', filesList.length);
    return q.all(filesList.map(throat(settings.resizeConcurrency, resizeItem)));
};

var updating = false;

module.exports.update = function(cb) {
    var listTemp = list(settings.rootDir);
    if (!updating) {
    updating = true;
    connect(settings)
        .then(listTemp)
        .then(function(dirs){
            initP('list', dirs.length);
            var promises=[];
            dirs.list.forEach(function(dir){
                var listPromise = list('temp/'+dir.name+'/render')();
                promises.push(listPromise);
            });
            return q.all(promises);
        })
        .then(function(renderDirs){
            initP('list', renderDirs.renderDirs);
            var promises=[];
            renderDirs.forEach(function(renderDir) {
                renderDir.list.forEach(function(dir){
                    var listPromise = list(renderDir.path+'/'+dir.name)();
                    var listPromiseSub = list(renderDir.path+'/'+dir.name+'/original')();
                    promises.push(listPromise);
                    promises.push(listPromiseSub);
                });
            });
            return q.all(promises);
        })
        .then(filterJpegs)
        .then(reduceList)
        .then(getDates)
        .then(sortByDate)
        .then(downloadNew)
        .then(createThumbs)
        .then(function(items){ cb(null, items) })
        .then(function(items){ niceLog(items); })
        .then(function(){
            updating=false;
            log('ftpdone');
            c.end();
            logModule.end();
        })
        .catch(function (err) {
            console.log(err);
        })
        .done();
    }
    else {
        cb('allready updating');
    }
    };
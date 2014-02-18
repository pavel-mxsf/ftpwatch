var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var ftpBrowser = require('./ftpBrowser');
var app = express();
var sl = require('./socketLogger');
var fs = require('fs-extra');


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.set('log level', 1);
server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
sl.setupIo(io);

var cache = {
    lastUpdate: new Date(),
    items: []
};

ftpBrowser.update(function(err, data){
    cache.items = data;
    cache.lastUpdate = new Date();
});

app.get('/', routes.index);
app.get('/partials/main', routes.main);

app.get('/update', function(req, res) {
    ftpBrowser.update(function(err, data){
        if (err) {
            res.end(err);
        }
        else
        {
            cache.items = data;
            cache.lastUpdate = new Date();
            res.send(data);
        }
    });
});

app.get('/cleanDownloaded', function(req,res) {

    var pth = path.join(__dirname, 'public', 'downloaded');
    fs.readdir(pth, function(err, dirs){
        if (!err) {
        dirs.forEach(function(dir){
            fs.readdir(path.join(pth,dir), function(err, files){
                if (!err) {
                    files.forEach(function(file){
                        fs.unlink(path.join(pth,dir,file), function (err) {
                            if (!err) {
                            res.send('deleted');
                            console.log('successfully deleted '+file);
                            cache = {
                                    lastUpdate: new Date(),
                                    items: []
                                };
                            }
                        });
                    });
                }
            });
        });
        }
    });
});

app.get('/data', function(req,res){
   res.json(cache);
});

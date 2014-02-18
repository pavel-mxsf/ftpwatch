var socketIo;
function setupIo(io) {
    socketIo = io;
}

function sendMsg(msg) {
    var date = new Date();
    socketIo.sockets.clients().forEach(function(s){
        if (s) {
            s.emit('log', {date:date, message:msg})
        }
    });
}

var progressList = {};
var socketPause = false;
function initProgress (name, num) {
    num = num ? num : 1;
    if (progressList[name]) {
        progressList[name].total += num;
    }
    else
    {
        progressList[name] = { progress: 0, total: num, name: name, date: new Date() };
    }
    if (!socketPause) {
        socketPause = true;
        setTimeout(function(){socketPause=false},200);
        socketIo.sockets.clients().forEach(function(s){
            if (s) {
                s.emit('prog', progressList[name]);
            }
        });
    }
}

function incProgress(name, num) {
    num = num ? num : 1;
    var date = new Date();
    if (progressList[name]) {
        progressList[name].progress += num;
        progressList[name].date = date;
        if (!socketPause) {
            socketPause = true;
            setTimeout(function(){socketPause=false}, 200);
            socketIo.sockets.clients().forEach(function(s){
                if (s) {
                    s.emit('prog', progressList[name]);
                }
            });
        }
    }
    else {
        console.log('init progress first: '+name);
    }
}

function end() {
    progressList = {};
}

module.exports.setupIo = setupIo;
module.exports.sendMsg = sendMsg;
module.exports.initProgress = initProgress;
module.exports.incProgress = incProgress;
module.exports.end = end;
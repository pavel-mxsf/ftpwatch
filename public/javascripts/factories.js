'use strict';
(function() {
var app = angular.module('ftpWatcher');

app.factory('socket', function (socketFactory) {
    return socketFactory();
});

})();

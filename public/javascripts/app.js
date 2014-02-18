'use strict';
(function() {
var app = angular.module('ftpWatcher', ['ngRoute', 'infinite-scroll', 'btford.socket-io', 'ngAnimate']);

app.config(function($routeProvider){
    console.log('config');
    $routeProvider
        .when('/', {controller:'mainCtrl', templateUrl: 'partials/main'})
        .otherwise({redirectTo:'/'});
});
})();
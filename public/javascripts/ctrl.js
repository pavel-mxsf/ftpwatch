'use strict';
(function() {
var app = angular.module('ftpWatcher');

app.controller('mainCtrl', function mainCtrl($scope, $http, itemsService, socket) {
    $scope.items = [];
    $scope.numToShow = 10;
    $scope.predicate = 'date';

    $scope.$watch(function(){return itemsService.items}, function(data){
        $scope.items = data;
    });

    $scope.pagingFunction = function() {
        $scope.numToShow += 1;
    };

    $scope.getItems = function(){
        itemsService.update();
    };
    $scope.reloadImagesFromFTP = function(){
        itemsService.reloadImagesFromFTP();
    };
    $scope.cleanDownloaded = function() {
        $scope.items = [];
        itemsService.cleanDownloaded();
    };

    $scope.getItems();
    socket.on('log', function(data){
        if (data.message === "ftpdone") {
            console.log('update done, downloading data');
            $scope.getItems();
        }
       });

});





})();
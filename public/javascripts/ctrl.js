'use strict';
var app = angular.module('vizeGallery', ['ngRoute', 'infinite-scroll', 'btford.socket-io', 'ngAnimate']);

app.config(function($routeProvider){
   $routeProvider
       .when('/', {controller:'mainCtrl', templateUrl: 'partials/main'})
       .otherwise({redirectTo:'/'});
});

app.controller('mainCtrl',
function mainCtrl($scope, $http, itemsService, socket) {
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
    $scope.getItems();
    socket.on('log', function(data){
        if (data.message === "ftpdone") {
            console.log('update done, downloading data');
            $scope.getItems();
        }
       });

});

app.service('itemsService', function($http) {
   var that = this;
   this.items = [];
   this.itemsByProject = [];
   this.update = function() {
       $http.get('/data').success(function(data){
           that.items = data.items;
           that.groupByProject();
           console.log(that.itemsByProject);
       });
   };

   this.reloadImagesFromFTP = function(){
        $http.get('/update').success(function(data){

        });
   };

    this.groupByProject = function() {
       that.items.forEach(function(item) {
           var added = false;
           that.itemsByProject.forEach(function(pItem){
               if (pItem.projectName===item.project) {
                   pItem.images.push(item);
                   added = true;
               }
           });
           if (!added) {that.itemsByProject.push({projectName:item.project, images:[item]})}
       });
    }

});

app.factory('socket', function (socketFactory) {
    return socketFactory();
});

app.directive('log', function(socket,$timeout) {
    return {
        restrict: 'E',
        template: '<div ng-show="visible" class="animate-show bottombar"><h3>Update in progress</h3>{{progressName}} : {{progress}} / {{progressMax}} ' +
            '<div class="progress">' +
            '<div class="progress-bar" role="progressbar" aria-valuenow="{{progress}}" aria-valuemin="0" aria-valuemax="{{progressMax}}" style="width: {{100*progress/progressMax}}%">' +
            '<span class="sr-only">{{progressName}} : {{progress}} / {{progressMax}}</span>' +
            '{{100*progress/progressMax | number:0}}%' +
            '</div>' +
            '</div>',
        replace: true,
        link: function(scope, element) {
            scope.visible = false;
            scope.progressName = '';
            scope.progressMax = 0;
            scope.progress = 0;
            socket.on('prog', function(data){
                scope.visible = true;
                scope.progressName = data.name;
                scope.progressMax = data.total;
                scope.progress = data.progress;
                scope.$apply();

            });
            socket.on('log', function(data){
                if (data.message === "ftpdone") {
                    $timeout(function(){scope.visible=false}, 500);
                }
            });


        }
    }

});

app.filter('slice', function() {
    return function(arr, start, end) {
        return arr.slice(start, end);
    };
});

app.filter('bytes', function() {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
            number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    }
});

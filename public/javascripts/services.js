'use strict';
(function() {
var app = angular.module('ftpWatcher');

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
        $http.get('/update').success(function(msg){
            console.log(msg);
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
})();
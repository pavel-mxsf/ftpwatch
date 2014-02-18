(function(){
var app = angular.module('ftpWatcher');

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
})();
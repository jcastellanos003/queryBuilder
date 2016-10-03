/// <reference path="../../../../../../../typings/angularjs/angular.d.ts" />

module widgets {
    'use strict';
    declare var CPALS: any;
    declare var KeyCodes: any;

    angular
        .module(CPALS.modules.directives.MAIN)
        .directive('typeahead', typeahead);

    typeahead.$inject = ['$timeout']
    function typeahead($timeout): ng.IDirective {
        var directive = <ng.IDirective> {
            require: 'ngModel',
            link: function(scope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes, controller) {
              var currentState = 0;

              element.bind('click', () => {
                controller.$setViewValue('');
                $timeout(() => {
                  controller.$setViewValue(' ');
                }, 500);
              })
              element.bind('keyup', (e) => {
                if(e.keyCode === KeyCodes.KEY_RETURN || e.keyCode === KeyCodes.KEY_SPACE) {
                  $timeout(() => {
                    if(currentState !== scope.queryBuilderCtrl.orchestrator.getCurrentState() || currentState === 1 || currentState === 3) {
                        currentState = scope.queryBuilderCtrl.orchestrator.getCurrentState();
                        controller.$setViewValue(' ');
                    }
                  }, 250);
                }
                if(e.keyCode === KeyCodes.KEY_LEFT || e.keyCode === KeyCodes.KEY_RIGHT) {
                  controller.$setViewValue('');
                  $timeout(() => {
                    controller.$setViewValue(' ');
                  }, 500);
                }
                if(e.keyCode === KeyCodes.KEY_BACK_SPACE || e.keyCode === KeyCodes.KEY_DELETE) {
                    controller.$setViewValue('');
                    $timeout(() => {
                        currentState = scope.queryBuilderCtrl.orchestrator.getCurrentState();
                        controller.$setViewValue(' ');
                    }, 500);
                }
              });
              element.bind('blur', function() {
                controller.$setViewValue('');
              });
            }
        };

        return directive;
    }
}

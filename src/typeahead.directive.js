var widgets;
(function (widgets) {
    'use strict';
    angular
        .module(CPALS.modules.directives.MAIN)
        .directive('typeahead', typeahead);
    typeahead.$inject = ['$timeout'];
    function typeahead($timeout) {
        var directive = {
            require: 'ngModel',
            link: function (scope, element, attrs, controller) {
                var currentState = 0;
                element.bind('click', function () {
                    controller.$setViewValue('');
                    $timeout(function () {
                        controller.$setViewValue(' ');
                    }, 500);
                });
                element.bind('keyup', function (e) {
                    if (e.keyCode === KeyCodes.KEY_RETURN || e.keyCode === KeyCodes.KEY_SPACE) {
                        $timeout(function () {
                            if (currentState !== scope.queryBuilderCtrl.orchestrator.getCurrentState() || currentState === 1 || currentState === 3) {
                                currentState = scope.queryBuilderCtrl.orchestrator.getCurrentState();
                                controller.$setViewValue(' ');
                            }
                        }, 250);
                    }
                    if (e.keyCode === KeyCodes.KEY_LEFT || e.keyCode === KeyCodes.KEY_RIGHT) {
                        controller.$setViewValue('');
                        $timeout(function () {
                            controller.$setViewValue(' ');
                        }, 500);
                    }
                    if (e.keyCode === KeyCodes.KEY_BACK_SPACE || e.keyCode === KeyCodes.KEY_DELETE) {
                        controller.$setViewValue('');
                        $timeout(function () {
                            currentState = scope.queryBuilderCtrl.orchestrator.getCurrentState();
                            controller.$setViewValue(' ');
                        }, 500);
                    }
                });
                element.bind('blur', function () {
                    controller.$setViewValue('');
                });
            }
        };
        return directive;
    }
})(widgets || (widgets = {}));

//# sourceMappingURL=typeahead.directive.js.map

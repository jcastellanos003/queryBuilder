"use strict";
require('./helpers/polyfill.array.findIndex');
require('./helpers/polyfill.array.find');
require('./helpers/polyfill.string.startsWith');
require('./queryBuilder.controller');
require('./queryBuilder.service');
require('./queryBuilder.scss');
require('./queryBuilder.constants');
var orchestratorObject_1 = require('./core/orchestratorObject');
var widgets;
(function (widgets) {
    'use strict';
    queryBuilder.$inject = ['queryBuilderConstant'];
    function queryBuilder(queryBuilderConstant) {
        var directive = {
            restrict: 'EA',
            scope: {
                model: '=model',
                tableView: '=?',
                isDisabled: '=?',
                queryValue: '=?',
                onBeforeOpenNewWindow: '&?',
                openNewWindow: '=?',
                onNewSearch: '=?'
            },
            templateUrl: 'scripts/app/directives/queryBuilder/queryBuilder.html',
            link: queryBuilderlink,
            controller: 'QueryBuilderController',
            controllerAs: 'queryBuilderCtrl'
        };
        function queryBuilderlink(scope, element, attrs, controller) {
            var input = element.find('textarea')[0], newSearchLink = element.find('a.new-search'), searchButton = element.find('#glassSearch'), modelView = scope.model;
            autosize(input);
            Rx.Observable.fromEvent(input, 'focus')
                .filter(function () {
                return typeof scope.queryValue !== 'undefined' && controller.orchestrator.getQuery().length === 0;
            })
                .subscribe(function () {
                controller.instanceOrchestrator();
            });
            Rx.Observable.fromEvent(input, 'keydown')
                .map(function (e) {
                if (e.keyCode === KeyCodes.KEY_RETURN) {
                    e.preventDefault();
                }
                return { e: e, keyCode: e.keyCode, isCtrl: e.ctrlKey, value: '', field: input };
            })
                .do(function (info) {
                controller.setTypedQuery(info.field.value);
                autosize.update(input);
            })
                .filter(function (info) {
                return Boolean(info.keyCode === KeyCodes.KEY_BACK_SPACE || info.keyCode === KeyCodes.KEY_DELETE || (info.isCtrl && (info.keyCode === KeyCodes.KEY_X)));
            })
                .distinctUntilChanged()
                .subscribe(function (info) {
                controller.setDeleteStatement(info);
            });
            Rx.Observable.fromEvent(input, 'keyup')
                .map(function (e) {
                return { e: e, keyCode: e.keyCode, value: controller.filterText(input.value).trim(), field: input };
            })
                .do(function (info) {
                controller.keyValidations(info);
                if (controller.setCursorPositionWhenRange(info) && info.keyCode !== KeyCodes.KEY_BACK_SPACE) {
                    info.field.value = info.field.value + "''";
                    info.field.setSelectionRange(info.field.value.length - 1, info.field.value.length - 1);
                }
            })
                .filter(function (info) {
                return controller.setStatusValidity(info);
            })
                .distinctUntilChanged()
                .subscribe(function (info) {
                controller.setNextState(info.value, info.field.selectionStart, info.keyCode === KeyCodes.KEY_RETURN);
            });
            Rx.Observable
                .from(newSearchLink).subscribe(function (link) {
                Rx.Observable.fromEvent(link, 'click')
                    .subscribe(function () {
                    controller.deleteAllFragments();
                    input.value = "";
                    autosize.update(input);
                    scope.queryValue = null;
                    if (scope.onNewSearch) {
                        scope.onNewSearch();
                        scope.$root.$broadcast(queryBuilderConstant.EVENTS.ON_NEW_SEARCH);
                    }
                    scope.$apply();
                });
            });
            Rx.Observable.fromEvent(searchButton, 'click')
                .subscribe(function () {
                var field = input;
                controller.setNextState(controller.filterText(field.value), field.selectionStart, true);
            });
            scope.$watch('this.model', function (vm) {
                controller.orchestrator = new orchestratorObject_1.query.core.Orchestrator(vm);
                autosize.update(input);
                if (controller.selected) {
                    input.value = controller.selected;
                }
                else {
                    input.value = "";
                    autosize.update(input);
                }
            });
            scope.isInputEmpty = function () {
                var inputValue = input.value;
                return !inputValue.length;
            };
        }
        return directive;
    }
    angular
        .module(CPALS.modules.directives.MAIN)
        .directive('queryBuilder', queryBuilder);
})(widgets || (widgets = {}));

//# sourceMappingURL=queryBuilder.directive.js.map

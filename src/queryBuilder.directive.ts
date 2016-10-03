/// <reference path="../../../../../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../../../../../typings/rx/rx.d.ts" />
/// <reference path="../../../../../../../typings/rx/rx.async.d.ts" />

import './helpers/polyfill.array.findIndex';
import './helpers/polyfill.array.find';
import './helpers/polyfill.string.startsWith';

import './queryBuilder.controller';
import './queryBuilder.service';
import './queryBuilder.scss';
import './queryBuilder.constants';

import { query } from './core/orchestratorObject';
import { transpiler } from './core/queryTranspiler';
import { IQueryBuilderScope, IQueryBuilderController } from './models/component';
import { IQueryMapKeyboard } from './models/helpers';
import { QueryState } from './models/objects';

module widgets {
    'use strict';

    declare var CPALS: any;
    declare var KeyCodes: any;
    declare var autosize: any;
    queryBuilder.$inject = ['queryBuilderConstant'];

    function queryBuilder(queryBuilderConstant: any): ng.IDirective {
        var directive = <ng.IDirective> {
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

        function queryBuilderlink(scope: IQueryBuilderScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes, controller: IQueryBuilderController): void {
            let input: HTMLTextAreaElement = <HTMLTextAreaElement>element.find('textarea')[0],
                newSearchLink : ng.IAugmentedJQuery = element.find('a.new-search'),
                searchButton = element.find('#glassSearch'),
                modelView = scope.model;
            
            autosize(input);
            //from keyboard actions
            Rx.Observable.fromEvent(input, 'focus')
            .filter((): boolean => {
                return typeof scope.queryValue !== 'undefined' && controller.orchestrator.getQuery().length === 0;
            })
            .subscribe(() => {
                controller.instanceOrchestrator();
            });

            Rx.Observable.fromEvent(input, 'keydown')
            .map((e: KeyboardEvent): IQueryMapKeyboard => {
                if (e.keyCode === KeyCodes.KEY_RETURN) {
                    e.preventDefault();
                }
                return <IQueryMapKeyboard>{ e: e, keyCode: e.keyCode, isCtrl: e.ctrlKey, value: '', field: <HTMLTextAreaElement>input };
            })
            .do((info: IQueryMapKeyboard): void => {
                controller.setTypedQuery(info.field.value);
                autosize.update(input);
            })
            .filter((info: IQueryMapKeyboard): boolean => {
                return Boolean(info.keyCode === KeyCodes.KEY_BACK_SPACE || info.keyCode === KeyCodes.KEY_DELETE || (info.isCtrl && (info.keyCode === KeyCodes.KEY_X)));
            })
            .distinctUntilChanged()
            .subscribe((info: IQueryMapKeyboard): void => {
                controller.setDeleteStatement(info);
            });

            Rx.Observable.fromEvent(input, 'keyup')
            .map((e: KeyboardEvent): IQueryMapKeyboard => {
                return <IQueryMapKeyboard>{ e: e, keyCode: e.keyCode, value: controller.filterText((<HTMLTextAreaElement>input).value).trim(), field: <HTMLTextAreaElement>input };
            })
            .do((info: IQueryMapKeyboard): void => {
                controller.keyValidations(info);
                if(controller.setCursorPositionWhenRange(info) && info.keyCode !== KeyCodes.KEY_BACK_SPACE) {
                    info.field.value = info.field.value + "''";
                    info.field.setSelectionRange(info.field.value.length - 1, info.field.value.length - 1);
                }
            })
            .filter((info: IQueryMapKeyboard): boolean => {
                return controller.setStatusValidity(info);
            })
            .distinctUntilChanged()
            .subscribe((info: IQueryMapKeyboard): void => {
                controller.setNextState(info.value, info.field.selectionStart, info.keyCode === KeyCodes.KEY_RETURN);
            });

            //from new search action
            Rx.Observable
            .from(newSearchLink).subscribe((link: any) => {
              Rx.Observable.fromEvent(link, 'click')
                .subscribe(() => {
                    controller.deleteAllFragments();
                    (<HTMLTextAreaElement>input).value = "";
                    autosize.update(input);
                    scope.queryValue = null;
                    if(scope.onNewSearch) {
                        scope.onNewSearch();
                        scope.$root.$broadcast(queryBuilderConstant.EVENTS.ON_NEW_SEARCH);
                    }
                    scope.$apply();
                });
            });

            //from search action
            Rx.Observable.fromEvent(searchButton, 'click')
            .subscribe(() => {
                let field = <HTMLTextAreaElement>input;
                controller.setNextState(controller.filterText(field.value), field.selectionStart, true);
            });

            //watchers
            scope.$watch('this.model', (vm: Object): void => {
                controller.orchestrator = new query.core.Orchestrator(vm);
                autosize.update(input);
                if (controller.selected) {
                    input.value = controller.selected
                } else {
                    input.value = "";
                    autosize.update(input);
                }
            });

            scope.isInputEmpty = (): boolean => {
                let inputValue = (<HTMLTextAreaElement>input).value;
                return !inputValue.length;
            }
        }

        return directive;
    }

    angular
    .module(CPALS.modules.directives.MAIN)
    .directive('queryBuilder', queryBuilder);
}

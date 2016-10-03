/// <reference path="../../../../../../../typings/angularjs/angular.d.ts" />

import './queryBuilder.service';

import { IOrchestrator } from './core/orchestrator';
import { IQueryTranspiler } from './core/transpiler';
import { IQueryBuilderController, IQueryBuilderScope, IQueryBuilderService } from './models/component';
import { IQueryMapKeyboard } from './models/helpers';

import { query } from './core/orchestratorObject';
import { transpiler } from './core/queryTranspiler';
import { QueryElement } from './core/queryElement';
import { QueryState } from './models/objects';

module widgets {
    'use strict';

    declare var CPALS: any;

    class QueryBuilderController implements IQueryBuilderController {
        selected: string;
        currentValue: string;
        current: Object;
        orchestrator: IOrchestrator;
        queryTranspiler: IQueryTranspiler;
        shouldSearch: boolean;
        currentPosition: number;
        $scope: IQueryBuilderScope;

        static $inject = ["$rootScope", "$scope", "$timeout", "QueryBuilderService"];
        constructor(private $rootScope: ng.IRootScopeService, $scope: IQueryBuilderScope, 
        private $timeout: any, private QueryBuilderService: IQueryBuilderService) {
            this.$scope = $scope;
            this.orchestrator = new query.core.Orchestrator(this.$scope.model);
            this.queryTranspiler = new transpiler.core.ESQueryTranspiler();
            this.updateInputState(QueryState.DO, true);
            //when there is an instance of the orchestrator class
            this.instanceOrchestrator();
        }

        instanceOrchestrator(): void {
            if (!this.$scope.queryValue) return;
            this.shouldSearch = true;
            this.selected = this.$scope.queryValue.map((x: QueryElement) => { return x.text }).join(' ');
            this.$scope.queryValue.forEach((x: any): void => {
                this.orchestrator.addTerm(x.text);
            });
            this.updateParentData();
        }

        filterText(value: string): string {
            return this.QueryBuilderService.filterText(this.orchestrator, value);
        }

        setNextState(value: string, position: number, shouldSearch: boolean): void {
            this.shouldSearch = this.QueryBuilderService.validShouldSearch(shouldSearch, this.orchestrator.getIsOrderBy(), this.orchestrator.getCurrentState());
            this.setCurrentPosition(position);
            this.addNextTerm(value, position);
        }

        bindAllModel(item: string, $event: any): void {
            let modelResult = this.QueryBuilderService.bindAllModel(this.orchestrator, $event.target.value, item, $event.target.selectionStart);
            this.selected = modelResult.value;
            $event.target.selectionStart = modelResult.position;
            this.setNextState(item, modelResult.position, false);
        }

        handleQueryPasted($event: any): void {
            this.$timeout((): void => {
                this.QueryBuilderService.handleCopiedText($event.target, this.orchestrator);
                this.setCurrentPosition($event.target.selectionStart);
                this.updateInputState(QueryState.DO);
            });
        }

        getNextTerms($viewValue: string): Array<string> {
            return this.QueryBuilderService.getNextTerms(this.currentPosition, this.currentValue, this.orchestrator);
        }

        deleteAllFragments(): void {
            this.orchestrator.removeAllTerms();
            this.updateInputState(QueryState.DO, true);
            this.setTableViewQuery(null);
            this.QueryBuilderService.resetReplaceEvent();
        }

        keyValidations(info: IQueryMapKeyboard): void {
            this.detectQueryChanges(info);
            this.validStatusQuery(info);
        }

        setDeleteStatement(info: IQueryMapKeyboard): void {
            this.currentValue = info.field.value;
            this.setCurrentPosition(info.field.selectionStart);
            if (info.field.selectionStart === 0) this.deleteAllFragments();
            this.QueryBuilderService.resetTermsWhenDeletePerformed(info, this.orchestrator);
        }

        setStatusValidity(info: IQueryMapKeyboard): boolean {
            return this.QueryBuilderService.validStatus(info, this.orchestrator);
        }

        setTypedQuery(value: string): void {
            this.QueryBuilderService.resetTypedQuery(value);
        }

        setCursorPositionWhenRange(info: IQueryMapKeyboard): boolean {
            return this.QueryBuilderService.getSimpleQuotesFromRange(this.orchestrator, info);
        }

        getCursorPosition($event: any): void {
            this.setCurrentPosition($event.target.selectionStart);
        }

        setTableViewRawQuery(query: Array<QueryElement>): void {
            if (this.$scope.tableView) {
                this.$scope.tableView.setRawQuery(query);
            }
        }

        private validStatusQuery(info: IQueryMapKeyboard): void {
            this.setCurrentPosition(info.field.selectionStart);
            if(this.QueryBuilderService.validStatusQuery(info, this.orchestrator, this.currentPosition))
                this.updateInputState(QueryState.DO, true);
            else
                this.updateInputState(QueryState.WRITING);
        }

        private detectQueryChanges(info: IQueryMapKeyboard): void {
            this.QueryBuilderService.detectQueryChanges(info, this.orchestrator);
        }

        private updateInputState(state: number, isValid: boolean = this.orchestrator.isValidQuery()): void {
            this.$timeout(() => {
                this.current = this.QueryBuilderService.updateQueryState(state, isValid);
            });
        }

        private addNextTerm(value: string, position: number): void {
            if(this.QueryBuilderService.addNextTerm(value, position, this.orchestrator, false)) {
                this.updateQueryState(QueryState.DO);
            }
            this.updateInputState(QueryState.DO);
        }

        private setCurrentPosition(position: number): void {
            this.currentPosition = position;
        }

        private updateQueryState(state: number): void {
            if(state === QueryState.DO && this.orchestrator.isValidQuery()) this.updateParentData();
            this.updateInputState(state);
        }

        private updateParentData(): void {
            if(!this.shouldSearch) return;
            this.QueryBuilderService.handleOpenWindow(this.$scope.openNewWindow, this.$scope.onBeforeOpenNewWindow)
            this.setTableViewQuery(this.queryTranspiler.transpileQuery(this.orchestrator.getQuery()));
        }

        private reloadParentData(firstDelete: boolean): void {
            if(!this.orchestrator.isValidQuery() && !firstDelete) return;
            this.setTableViewQuery(firstDelete || this.orchestrator.getQuery().length === 2 ? null : this.queryTranspiler.transpileQuery(this.orchestrator.getQuery()));
        }

        private setTableViewQuery(query: string): void {
            if(this.$scope.tableView) {
                this.$rootScope.$broadcast('ShowColumnsFromQueryBuilder', this.orchestrator.getQuery());
                this.$scope.tableView.setQuery(query);
                this.resetSortIndicator();
                if(!query) {
                    this.$rootScope.$broadcast('ShowHideColumns');
                    this.setTableViewRawQuery(undefined);
                } else {
                    this.setTableViewRawQuery(this.orchestrator.getQuery().slice());
                }
            }
        }

        private resetSortIndicator(): void {
            this.$timeout(() => {
                if (this.orchestrator.getIsOrderBy()) {
                    this.$scope.tableView.clearSorts();
                } else {
                    this.$scope.tableView.setDefaultSort();
                }
            });
        }
    }

    angular
    .module(CPALS.modules.directives.MAIN)
    .controller('QueryBuilderController', QueryBuilderController);
}
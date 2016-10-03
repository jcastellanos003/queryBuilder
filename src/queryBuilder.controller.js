"use strict";
require('./queryBuilder.service');
var orchestratorObject_1 = require('./core/orchestratorObject');
var queryTranspiler_1 = require('./core/queryTranspiler');
var objects_1 = require('./models/objects');
var widgets;
(function (widgets) {
    'use strict';
    var QueryBuilderController = (function () {
        function QueryBuilderController($rootScope, $scope, $timeout, QueryBuilderService) {
            this.$rootScope = $rootScope;
            this.$timeout = $timeout;
            this.QueryBuilderService = QueryBuilderService;
            this.$scope = $scope;
            this.orchestrator = new orchestratorObject_1.query.core.Orchestrator(this.$scope.model);
            this.queryTranspiler = new queryTranspiler_1.transpiler.core.ESQueryTranspiler();
            this.updateInputState(objects_1.QueryState.DO, true);
            this.instanceOrchestrator();
        }
        QueryBuilderController.prototype.instanceOrchestrator = function () {
            var _this = this;
            if (!this.$scope.queryValue)
                return;
            this.shouldSearch = true;
            this.selected = this.$scope.queryValue.map(function (x) { return x.text; }).join(' ');
            this.$scope.queryValue.forEach(function (x) {
                _this.orchestrator.addTerm(x.text);
            });
            this.updateParentData();
        };
        QueryBuilderController.prototype.filterText = function (value) {
            return this.QueryBuilderService.filterText(this.orchestrator, value);
        };
        QueryBuilderController.prototype.setNextState = function (value, position, shouldSearch) {
            this.shouldSearch = this.QueryBuilderService.validShouldSearch(shouldSearch, this.orchestrator.getIsOrderBy(), this.orchestrator.getCurrentState());
            this.setCurrentPosition(position);
            this.addNextTerm(value, position);
        };
        QueryBuilderController.prototype.bindAllModel = function (item, $event) {
            var modelResult = this.QueryBuilderService.bindAllModel(this.orchestrator, $event.target.value, item, $event.target.selectionStart);
            this.selected = modelResult.value;
            $event.target.selectionStart = modelResult.position;
            this.setNextState(item, modelResult.position, false);
        };
        QueryBuilderController.prototype.handleQueryPasted = function ($event) {
            var _this = this;
            this.$timeout(function () {
                _this.QueryBuilderService.handleCopiedText($event.target, _this.orchestrator);
                _this.setCurrentPosition($event.target.selectionStart);
                _this.updateInputState(objects_1.QueryState.DO);
            });
        };
        QueryBuilderController.prototype.getNextTerms = function ($viewValue) {
            return this.QueryBuilderService.getNextTerms(this.currentPosition, this.currentValue, this.orchestrator);
        };
        QueryBuilderController.prototype.deleteAllFragments = function () {
            this.orchestrator.removeAllTerms();
            this.updateInputState(objects_1.QueryState.DO, true);
            this.setTableViewQuery(null);
            this.QueryBuilderService.resetReplaceEvent();
        };
        QueryBuilderController.prototype.keyValidations = function (info) {
            this.detectQueryChanges(info);
            this.validStatusQuery(info);
        };
        QueryBuilderController.prototype.setDeleteStatement = function (info) {
            this.currentValue = info.field.value;
            this.setCurrentPosition(info.field.selectionStart);
            if (info.field.selectionStart === 0)
                this.deleteAllFragments();
            this.QueryBuilderService.resetTermsWhenDeletePerformed(info, this.orchestrator);
        };
        QueryBuilderController.prototype.setStatusValidity = function (info) {
            return this.QueryBuilderService.validStatus(info, this.orchestrator);
        };
        QueryBuilderController.prototype.setTypedQuery = function (value) {
            this.QueryBuilderService.resetTypedQuery(value);
        };
        QueryBuilderController.prototype.setCursorPositionWhenRange = function (info) {
            return this.QueryBuilderService.getSimpleQuotesFromRange(this.orchestrator, info);
        };
        QueryBuilderController.prototype.getCursorPosition = function ($event) {
            this.setCurrentPosition($event.target.selectionStart);
        };
        QueryBuilderController.prototype.setTableViewRawQuery = function (query) {
            if (this.$scope.tableView) {
                this.$scope.tableView.setRawQuery(query);
            }
        };
        QueryBuilderController.prototype.validStatusQuery = function (info) {
            this.setCurrentPosition(info.field.selectionStart);
            if (this.QueryBuilderService.validStatusQuery(info, this.orchestrator, this.currentPosition))
                this.updateInputState(objects_1.QueryState.DO, true);
            else
                this.updateInputState(objects_1.QueryState.WRITING);
        };
        QueryBuilderController.prototype.detectQueryChanges = function (info) {
            this.QueryBuilderService.detectQueryChanges(info, this.orchestrator);
        };
        QueryBuilderController.prototype.updateInputState = function (state, isValid) {
            var _this = this;
            if (isValid === void 0) { isValid = this.orchestrator.isValidQuery(); }
            this.$timeout(function () {
                _this.current = _this.QueryBuilderService.updateQueryState(state, isValid);
            });
        };
        QueryBuilderController.prototype.addNextTerm = function (value, position) {
            if (this.QueryBuilderService.addNextTerm(value, position, this.orchestrator, false)) {
                this.updateQueryState(objects_1.QueryState.DO);
            }
            this.updateInputState(objects_1.QueryState.DO);
        };
        QueryBuilderController.prototype.setCurrentPosition = function (position) {
            this.currentPosition = position;
        };
        QueryBuilderController.prototype.updateQueryState = function (state) {
            if (state === objects_1.QueryState.DO && this.orchestrator.isValidQuery())
                this.updateParentData();
            this.updateInputState(state);
        };
        QueryBuilderController.prototype.updateParentData = function () {
            if (!this.shouldSearch)
                return;
            this.QueryBuilderService.handleOpenWindow(this.$scope.openNewWindow, this.$scope.onBeforeOpenNewWindow);
            this.setTableViewQuery(this.queryTranspiler.transpileQuery(this.orchestrator.getQuery()));
        };
        QueryBuilderController.prototype.reloadParentData = function (firstDelete) {
            if (!this.orchestrator.isValidQuery() && !firstDelete)
                return;
            this.setTableViewQuery(firstDelete || this.orchestrator.getQuery().length === 2 ? null : this.queryTranspiler.transpileQuery(this.orchestrator.getQuery()));
        };
        QueryBuilderController.prototype.setTableViewQuery = function (query) {
            if (this.$scope.tableView) {
                this.$rootScope.$broadcast('ShowColumnsFromQueryBuilder', this.orchestrator.getQuery());
                this.$scope.tableView.setQuery(query);
                this.resetSortIndicator();
                if (!query) {
                    this.$rootScope.$broadcast('ShowHideColumns');
                    this.setTableViewRawQuery(undefined);
                }
                else {
                    this.setTableViewRawQuery(this.orchestrator.getQuery().slice());
                }
            }
        };
        QueryBuilderController.prototype.resetSortIndicator = function () {
            var _this = this;
            this.$timeout(function () {
                if (_this.orchestrator.getIsOrderBy()) {
                    _this.$scope.tableView.clearSorts();
                }
                else {
                    _this.$scope.tableView.setDefaultSort();
                }
            });
        };
        QueryBuilderController.$inject = ["$rootScope", "$scope", "$timeout", "QueryBuilderService"];
        return QueryBuilderController;
    }());
    angular
        .module(CPALS.modules.directives.MAIN)
        .controller('QueryBuilderController', QueryBuilderController);
})(widgets || (widgets = {}));

//# sourceMappingURL=queryBuilder.controller.js.map

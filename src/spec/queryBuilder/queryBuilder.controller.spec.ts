/// <reference path="../../../../../../../typings/query-builder/query-builder.d.ts" />
/// <reference path="../../../../../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../../../../../src/main/webapp/scripts/app/directives/queryBuilder/core/orchestratorObject.ts" />
require('es6-shim');
var QueryBuilderService = require('directives/queryBuilder/queryBuilder.service');

var orchestrator: any = require('directives/queryBuilder/core/orchestratorObject');
var transpiler = require('directives/queryBuilder/core/queryTranspiler');
var queryElement = require('directives/queryBuilder/core/queryElement');
var queryState: any = require('directives/queryBuilder/models/objects');

declare var CPALS: any;

describe('CONTROLLER QUERYBUILDER', () => {
    let $scope = null,
        $rootScope = null,
        $timeout = null,
        QueryBuilderService = null,
        createController = null,
        queryValueWithValue = [
            {
                nextTerms: [
                    "ADG",
                    "AM/PM",
                    "Base", 
                    "BLK", 
                    "DHR", 
                    "Dow", 
                    "DPM", 
                    "Duty"
                ],
                position: {start: 0, end: 4},
                previousLength:-1,
                propType:"INTEGER",
                term:"pairingNumber",
                text:"Pg #",
                type:1
            },
            {
                nextTerms: [
                    "=", 
                    "IS", 
                    "!=", 
                    "!IS", 
                    "IS NOT", 
                    "<>", 
                    "IN", 
                    "==", 
                    "!IN", 
                    "NOT IN", 
                    "!==", 
                    ">", 
                    ">=", 
                    "<", 
                    "<=", 
                    "BETWEEN"
                ],
                position: {start: 5, end: 6},
                previousLength:4,
                propType:"INTEGER",
                term:"=",
                text:"=",
                type:2
            },
            {
                nextTerms: [],
                position: {start: 7, end: 8},
                previousLength:6,
                propType:"INTEGER",
                term:"1",
                text:"1",
                type:3
            }
        ],
        queryValueWithoutValue = [
            {
                nextTerms: [
                    "ADG",
                    "AM/PM",
                    "Base", 
                    "BLK", 
                    "DHR", 
                    "Dow", 
                    "DPM", 
                    "Duty"
                ],
                position: {start: 0, end: 4},
                previousLength:-1,
                propType:"INTEGER",
                term:"pairingNumber",
                text:"Pg #",
                type:1
            },
            {
                nextTerms: [
                    "=", 
                    "IS", 
                    "!=", 
                    "!IS", 
                    "IS NOT", 
                    "<>", 
                    "IN", 
                    "==", 
                    "!IN", 
                    "NOT IN", 
                    "!==", 
                    ">", 
                    ">=", 
                    "<", 
                    "<=", 
                    "BETWEEN"
                ],
                position: {start: 5, end: 6},
                previousLength:4,
                propType:"INTEGER",
                term:"=",
                text:"=",
                type:2
            }
        ],
        queryValueWithRangeOperator = [
            {
                nextTerms: [
                    "ADG",
                    "AM/PM",
                    "Base", 
                    "BLK", 
                    "DHR", 
                    "Dow", 
                    "DPM", 
                    "Duty"
                ],
                position: {start: 0, end: 4},
                previousLength:-1,
                propType:"INTEGER",
                term:"pairingNumber",
                text:"Pg #",
                type:1
            },
            {
                nextTerms: [
                    "=", 
                    "IS", 
                    "!=", 
                    "!IS", 
                    "IS NOT", 
                    "<>", 
                    "IN", 
                    "==", 
                    "!IN", 
                    "NOT IN", 
                    "!==", 
                    ">", 
                    ">=", 
                    "<", 
                    "<=", 
                    "BETWEEN"
                ],
                position: {start: 5, end: 7},
                previousLength:4,
                propType:"INTEGER",
                term:"IN",
                text:"IN",
                type:5
            }
        ],
        infoObject = {
            e: {
                altKey: false
            },
            field: {
                autocomplete:"off",
                autofocus:false,
                value: "1",
                selectionStart: 8
            },
            keyCode: 87,
            value: "Pg #"
        },
        infoBackSpaceObject = {
            e: {
                altKey: false,
                code:"Backspace"
            },
            field: {
                autocomplete:"off",
                autofocus:false,
                value: "Pg #",
                selectionStart: 8
            },
            keyCode: 8,
            value: ""
        };
        
    beforeEach(function () {
        angular.mock.module(CPALS.modules.directives.MAIN);
        angular.mock.module(CPALS.modules.utils.HELPERS);
        angular.mock.module('templates');
    });
        
    beforeEach(angular.mock.inject(($injector) => {
        let $controller = $injector.get('$controller');
        $rootScope = $injector.get('$rootScope');
        $scope = $rootScope.$new();
        $scope.model = {
            pairingNumber: { name: "Pg #", type: orchestrator.query.core.Types.INTEGER },
            baseStationCode: { name: "Base", type: orchestrator.query.core.Types.STRING }
        };
        $timeout = $injector.get('$timeout');
        QueryBuilderService = $injector.get('QueryBuilderService');

        createController = (): Object => {
            return $controller('QueryBuilderController', {
                $rootScope: $rootScope,
                $scope: $scope,
                $timeout: $timeout,
                QueryBuilderService: QueryBuilderService
            });
        }
    }));

    describe('QueryBuilderController behavior', () => {
        it('should initialize scope', () => {
            var controller = createController();
            var initialOrchestrator = new orchestrator.query.core.Orchestrator(controller.$scope.model);

            expect(controller.$scope).toBeDefined();
            expect(controller.$scope).toEqual($scope);

            expect(controller.orchestrator).toBeDefined();
            expect(controller.orchestrator).toEqual(jasmine.any(Object));

            expect(controller.queryTranspiler).toBeDefined();
            expect(controller.queryTranspiler).toEqual(jasmine.any(Object));
        });

        it('should instance orchestrator', () => {
            $scope.queryValue = queryValueWithValue;
            let controller = createController();
            spyOn(controller, 'updateParentData');
            controller.instanceOrchestrator();
            expect(controller.shouldSearch).toBeDefined();
            expect(controller.shouldSearch).toBeTruthy();
            expect(controller['updateParentData']).toHaveBeenCalled();
        });

        it('sould not instance orchestrator', () => {
            let controller = createController();
            spyOn(controller, 'updateParentData');
            controller.instanceOrchestrator();
            expect(controller.shouldSearch).toBeUndefined();
            expect(controller['updateParentData']).not.toHaveBeenCalled();
        });

        it('should return only the value', () => {
            $scope.queryValue = queryValueWithoutValue;
            let controller = createController();
            let newValue = "Pg # = 1";
            controller.instanceOrchestrator();
            expect(controller.orchestrator.getQuery()).toBeDefined();
            let filterTextCall = controller.filterText(newValue);
            expect(filterTextCall).toEqual("1");
        });

        it('should set next state ready to search', () => {
            $scope.queryValue = queryValueWithoutValue;
            let controller = createController();
            let newValue = "string";
            spyOn(controller, 'setCurrentPosition');
            spyOn(controller, 'addNextTerm');
            controller.instanceOrchestrator();
            let setNexStateToSearch = controller.setNextState(newValue, 8, true);
            expect(controller.shouldSearch).toBeDefined();
            expect(controller.shouldSearch).toBeTruthy();
            expect(controller.setCurrentPosition).toHaveBeenCalledWith(8);
            expect(controller.addNextTerm).toHaveBeenCalledWith(newValue, 8);
        });

        it('should set next state without search', () => {
            $scope.queryValue = queryValueWithValue;
            let controller = createController();
            let newValue = "AND";
            spyOn(controller, 'setCurrentPosition');
            spyOn(controller, 'addNextTerm');
            controller.instanceOrchestrator();
            let setNexStateToSearch = controller.setNextState(newValue, 12, true);
            expect(controller.shouldSearch).toBeFalsy();
            expect(controller.setCurrentPosition).toHaveBeenCalledWith(12);
            expect(controller.addNextTerm).toHaveBeenCalledWith(newValue, 12);
        });

        it('should add next term', () => {
            let controller = createController();
            let newValue = "Pg #";
            spyOn(controller, 'updateQueryState');
            let setNexStateToSearch = controller.addNextTerm(newValue, 4);
            expect(controller.updateQueryState).toHaveBeenCalledWith(queryState.QueryState.DO);
        });

        it('should get next terms after a value', () => {
            var concatOperators = ["AND", "*", "OR", "+", "ORDER BY"];
            $scope.queryValue = queryValueWithValue;
            let controller = createController();
            controller.instanceOrchestrator();
            controller.currentPosition = 9;
            let setNexStateToSearch = controller.getNextTerms();
            expect(setNexStateToSearch).toBeDefined();
            expect(setNexStateToSearch).toEqual(concatOperators);
        });

        it('should remove all fragments', () => {
            $scope.queryValue = queryValueWithValue;
            let controller = createController();
            spyOn(controller.orchestrator, 'removeAllTerms');
            spyOn(controller, 'updateInputState');
            spyOn(controller, 'setTableViewQuery');
            controller.instanceOrchestrator();
            let setNexStateToSearch = controller.deleteAllFragments();
            expect(controller.orchestrator.removeAllTerms).toHaveBeenCalled();
            expect(controller.updateInputState).toHaveBeenCalledWith(queryState.QueryState.DO, true);
            expect(controller.setTableViewQuery).toHaveBeenCalledWith(null);
        });

        it('should valid status query', () => {
            let controller = createController();
            spyOn(controller, 'updateInputState');
            let statusQuery = controller.validStatusQuery(infoObject);
            expect(controller.updateInputState).toHaveBeenCalledWith(queryState.QueryState.WRITING);
        });

        it('should validate info param', () => {
            let controller = createController();
            spyOn(controller, 'detectQueryChanges');
            spyOn(controller, 'validStatusQuery');
            let setNexStateToSearch = controller.keyValidations(infoObject);
            expect(controller.detectQueryChanges).toHaveBeenCalledWith(infoObject);
            expect(controller.validStatusQuery).toHaveBeenCalledWith(infoObject);
        });

        it('should set delete statement', () => {
            $scope.queryValue = queryValueWithoutValue;
            let controller = createController();
            spyOn(controller, 'setCurrentPosition');
            spyOn(controller.QueryBuilderService, 'resetTermsWhenDeletePerformed');
            controller.instanceOrchestrator();
            let setNexStateToSearch = controller.setDeleteStatement(infoBackSpaceObject);
            expect(controller.setCurrentPosition).toHaveBeenCalledWith(infoBackSpaceObject.field.selectionStart);
            expect(controller.QueryBuilderService.resetTermsWhenDeletePerformed).toHaveBeenCalled();
        });

        it('should deleteAllFragments be called', () => {
            $scope.queryValue = queryValueWithoutValue;
            let controller = createController();
            spyOn(controller, 'deleteAllFragments');
            controller.instanceOrchestrator();
            infoBackSpaceObject.field.selectionStart = 0;
            let setNexStateToSearch = controller.setDeleteStatement(infoBackSpaceObject);
            expect(controller.deleteAllFragments).toHaveBeenCalled();
        });

        it('should validate status', () => {
            $scope.queryValue = queryValueWithoutValue;
            let controller = createController();
            controller.instanceOrchestrator();
            let setNexStateToSearch = controller.setStatusValidity(infoObject);
            expect(setNexStateToSearch).toBeDefined();
            expect(setNexStateToSearch).toBeFalsy();
        });

        it('should set query', () => {
            let controller = createController();
            spyOn(controller.QueryBuilderService, 'resetTypedQuery');
            let newValue = " ";
            let setNexStateToSearch = controller.setTypedQuery(newValue);
            expect(controller.QueryBuilderService.resetTypedQuery).toHaveBeenCalledWith(newValue);
        });

        it('should get cursor position', () => {
            let controller = createController();
            spyOn(controller, 'setCurrentPosition');
            let newEvent = {
                target: {
                    selectionStart: 0
                }
            };
            let setNexStateToSearch = controller.getCursorPosition(newEvent);
            expect(controller.setCurrentPosition).toHaveBeenCalledWith(newEvent.target.selectionStart);
        });

        it('should set table view raw query', () => {
            let controller = createController();
            controller.$scope.tableView = {setRawQuery: function(){}};
            spyOn(controller.$scope.tableView, 'setRawQuery');
            let tableViewRaw = controller.setTableViewRawQuery(queryValueWithValue);
            expect(controller.$scope.tableView.setRawQuery).toHaveBeenCalled();
        });

        it('should detect changes', () => {
            let controller = createController();
            spyOn(controller.QueryBuilderService, 'detectQueryChanges');
            let tableViewRaw = controller.detectQueryChanges(infoObject);
            expect(controller.QueryBuilderService.detectQueryChanges).toHaveBeenCalledWith(infoObject, controller.orchestrator);
        });

        it('should update input state', () => {
            $scope.queryValue = queryValueWithValue;
            let controller = createController();
            spyOn(controller.QueryBuilderService, 'updateQueryState');
            controller.instanceOrchestrator();
            let isValid = controller.orchestrator.isValidQuery();
            let updateInputState = controller.updateInputState(1, isValid);
            controller.$timeout(() => {
                expect(controller.QueryBuilderService.updateQueryState).toHaveBeenCalled();
                expect(controller.current.state).toEqual(true);
            });
        });

        it('should update input state to false', () => {
            $scope.queryValue = queryValueWithValue;
            let controller = createController();
            spyOn(controller.QueryBuilderService, 'updateQueryState');
            controller.instanceOrchestrator();
            let isValid = controller.orchestrator.isValidQuery();
            let updateInputState = controller.updateInputState(1, isValid);
            controller.$timeout(() => {
                expect(controller.QueryBuilderService.updateQueryState).toHaveBeenCalled();
                expect(controller.current.state).toEqual(false);
            });
        });

        it('should set current position', () => {
            let controller = createController();
            let position = 5;
            let currentPosition = controller.setCurrentPosition(position);
            expect(controller.currentPosition).toEqual(position);
        });

        it('should update query state', () => {
            let controller = createController();
            spyOn(controller, 'updateInputState');
            spyOn(controller, 'updateParentData');
            let state = 1;
            let queryState = controller.updateQueryState(state);
            expect(controller.updateInputState).toHaveBeenCalled();
            expect(controller.updateParentData).not.toHaveBeenCalled();
        });

        it('should update query state and call updateParentData', () => {
            let controller = createController();
            spyOn(controller, 'updateInputState');
            spyOn(controller, 'updateParentData');
            $scope.queryValue = queryValueWithValue;
            controller.instanceOrchestrator();
            let state = 1;
            let queryState = controller.updateQueryState(state);
            expect(controller.updateInputState).toHaveBeenCalled();
            expect(controller.updateParentData).toHaveBeenCalled();
        });

        it('should call updateParentData without search', () => {
            let controller = createController();
            let queryState = controller.updateParentData();
            expect(controller.shouldSearch).toBeUndefined();
        });

        it('should reload parent data', () => {
            let controller = createController();
            let firstDelete = true;
            spyOn(controller, 'setTableViewQuery');
            $scope.queryValue = queryValueWithValue;
            controller.instanceOrchestrator();
            let queryState = controller.reloadParentData(firstDelete);
            expect(controller.setTableViewQuery).toHaveBeenCalled();
        });

        it('should update query state and call updateParentData', () => {
            let controller = createController();
            spyOn(controller, 'updateInputState');
            spyOn(controller, 'updateParentData');
            $scope.queryValue = queryValueWithValue;
            controller.instanceOrchestrator();
            let state = 1;
            let queryState = controller.updateQueryState(state);
            expect(controller.updateInputState).toHaveBeenCalled();
            expect(controller.updateParentData).toHaveBeenCalled();
        });

        it('should reload parent data with a invalid query', () => {
            let controller = createController();
            let firstDelete = true;
            spyOn(controller, 'setTableViewQuery');
            $scope.queryValue = queryValueWithoutValue;
            controller.instanceOrchestrator();
            let queryState = controller.reloadParentData(firstDelete);
            expect(controller.setTableViewQuery).toHaveBeenCalled();
        });

        it('should not reload parent data', () => {
            let controller = createController();
            let firstDelete = false;
            $scope.queryValue = queryValueWithoutValue;
            controller.instanceOrchestrator();
            let queryState = controller.reloadParentData(firstDelete);
            expect(controller.orchestrator.isValidQuery()).toEqual(false);
        });

        it('should reload parent data with first delete in false', () => {
            let controller = createController();
            let firstDelete = false;
            $scope.queryValue = queryValueWithValue;
            controller.instanceOrchestrator();
            spyOn(controller, 'setTableViewQuery');
            let queryState = controller.reloadParentData(firstDelete);
            expect(controller.setTableViewQuery).toHaveBeenCalled();
        });

        it('should set tableView', () => {
            let controller = createController();
            let query = "pairingNumber:+1";
            controller.$scope.tableView = {setRawQuery: function () {}};
            controller.$scope.tableView = { setQuery: function () { } };
            spyOn(controller.$rootScope, '$broadcast');
            spyOn(controller.$scope.tableView, 'setQuery');

            spyOn(controller, 'setTableViewRawQuery');
            spyOn(controller, 'resetSortIndicator');
            $scope.queryValue = queryValueWithValue;
            controller.instanceOrchestrator();
            let setTableView = controller.setTableViewQuery(query);
            expect(controller.$rootScope.$broadcast).toHaveBeenCalled();
            expect(controller.$scope.tableView.setQuery).toHaveBeenCalled();
            expect(controller.resetSortIndicator).toHaveBeenCalled();
        });

        it('should not set tableView', () => {
            let controller = createController();
            let query = null;
            controller.$scope.tableView = {setRawQuery: function () {}};
            controller.$scope.tableView = { setQuery: function () { } };
            spyOn(controller.$rootScope, '$broadcast');
            spyOn(controller.$scope.tableView, 'setQuery');
            spyOn(controller, 'setTableViewRawQuery');
            spyOn(controller, 'resetSortIndicator');
            let setTableView = controller.setTableViewQuery(query);
            expect(controller.$rootScope.$broadcast).toHaveBeenCalled();
            expect(controller.$scope.tableView.setQuery).toHaveBeenCalled();
            expect(controller.resetSortIndicator).toHaveBeenCalled();
            expect(controller.setTableViewRawQuery).toHaveBeenCalledWith(undefined);
        });

        it('should bind model on event', () => {
            let controller = createController();
            spyOn(controller, 'setNextState').and.callThrough();
            spyOn(controller, 'setCurrentPosition').and.callThrough();
            spyOn(controller, 'addNextTerm').and.callThrough();
            controller.instanceOrchestrator();
            let newEvent = {
                target: {
                    selectionStart: 0
                },
                value: 'Pg # ='
            };
            controller.bindAllModel('1000', newEvent);
            expect(controller.setNextState).toHaveBeenCalled();
            expect(controller.setCurrentPosition).toHaveBeenCalledWith(newEvent.target.selectionStart);
            expect(controller.addNextTerm).toHaveBeenCalledWith('1000', newEvent.target.selectionStart);
        });

        it('should bind all model when an item of list values is selected', (): void => {
            let controller = createController();
            controller.orchestrator = new orchestrator.query.core.Orchestrator(controller.$scope.model);
            controller.bindAllModel('Base', { target: { value: '', selectionStart: 0 } });
            expect(controller.selected).toEqual('Base');
        });

        it('should handle query pasted', (): void => {
            let controller = createController();
            spyOn(controller.QueryBuilderService, 'handleCopiedText');
            controller.instanceOrchestrator();
            let queryPasted = controller.handleQueryPasted({ target: { value: 'Base', selectionStart: 4 } });
            controller.$timeout.flush();
            expect(controller.QueryBuilderService.handleCopiedText).toHaveBeenCalled();
            expect(controller.current.state).toEqual(false);

        });
    });
});
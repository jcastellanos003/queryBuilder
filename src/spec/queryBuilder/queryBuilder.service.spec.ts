/// <reference path="../../../../../../../typings/query-builder/query-builder.d.ts" />
/// <reference path="../../../../../../../typings/angularjs/angular.d.ts" />

'use strict';

require('es6-shim');

require('directives/queryBuilder/queryBuilder.service.js');

var QueryBuilderService : QueryBuilder.IQueryBuilderService;
declare var CPALS: any;

var orchestratorObj: any = require('directives/queryBuilder/core/orchestratorObject.ts');

class Position {
    public end: number
    constructor(public start: number, end: number) {
        this.end = start + end;
    }
}

export class QueryElement {
    public position: Position;
    constructor(public term: string, public type: number, public text: string, public propType: string, public previousLength: number, public nextTerms: Array<string>) {
        this.position = new Position(previousLength + 1, text.length);
    }
}

describe('Service QueryBuilder', () => {

    let orchestrator: QueryBuilder.IOrchestrator;
    let currentQry: Array<QueryElement>;
    let model: Object;

    model = {
        stationCode: { name: "Airport Code", type: 'STRING' },
        cityName: { name: "City Name", type: 'STRING' },
        airportName: { name: "Airport Name", type: 'STRING' },
        stateCode: { name: "State Code", type: 'STRING' },
        swaStation: { name: "SWA Station", type: 'BOOLEAN' },
        contiguous: { name: "Contiguous", type: 'BOOLEAN' },
        pairingAlphaPrefixCode: { name: "Pair Prefix", type: 'STRING' },
        localTimeZoneName: { name: "Time Zone", type: 'STRING' },
        latitude: { name: "Latitude", type: 'REAL' },
        longitude: { name: "Longitude", type: 'REAL' },
        color: { name: "Base Color", type: 'STRING' },
        countryCode: { name: "Country Code", type: 'STRING' },
        domesticInternationalIndicator: { name: "Dom / Int", type: 'STRING' },
        usCustomsClearanceIndicator: { name: "US Customs Clearance", type: 'STRING' },
        a012: { name: "A012", type: 'BOOLEAN' }
    };
    
    beforeEach(angular.mock.module(CPALS.modules.directives.MAIN));
	beforeEach(angular.mock.inject(function(_QueryBuilderService_) {
		QueryBuilderService = _QueryBuilderService_;
	}));
    beforeEach((): void => {
        orchestrator = new orchestratorObj.query.core.Orchestrator(model);
    });

    it('should get an instance for orchestrator object', (): void => {
        expect(orchestrator).toBeDefined();
        expect(orchestrator.getCurrentState()).toEqual(0);
        expect(orchestrator.getNextTerms(-1)).toEqual( [ 'A012', 'Airport Code', 'Airport Name', 'Base Color', 'City Name', 
        'Contiguous', 'Country Code', 'Dom / Int', 'Latitude', 'Longitude', 'Pair Prefix', 'State Code', 'SWA Station', 'Time Zone', 'US Customs Clearance' ])
        expect(orchestrator.isValidQuery()).toBeFalsy();
    });

    it('should get next terms when exists a replace term', (): void => {
        QueryBuilderService.replaceEvent = true;
        QueryBuilderService.replaceTerm = { value: '', position: 12, startPosition: 0 };
        let nextTerms : Array<string> = QueryBuilderService.getNextTerms(11, 'Airport Code', orchestrator);
        expect(nextTerms).toBeDefined();
        expect(nextTerms.length).toBeGreaterThan(0);
        expect(nextTerms).toEqual(['Airport Code']);
    });

    it('should get next terms when delete was executed and last char is an space', (): void => {
        QueryBuilderService.replaceEvent = true;
        QueryBuilderService.replaceTerm = { value: '= abq', position: 13, startPosition: 0 };
        orchestrator.addTerm('Airport Code');
        let nextTerms : Array<string> = QueryBuilderService.getNextTerms(13, 'Airport Code = abq', orchestrator);
        expect(nextTerms).toBeDefined();
        expect(nextTerms.length).toEqual(16);
        expect(nextTerms).toEqual(["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", "STARTS WITH", "ENDS WITH", "CONTAINS", "!CONTAINS", "BETWEEN"]);
    });

    it('should get next terms', (): void => {
        QueryBuilderService.replaceEvent = false;
        let nextTerms : Array<string> = QueryBuilderService.getNextTerms(0, '', orchestrator);
        expect(nextTerms).toBeDefined();
        expect(nextTerms.length).toEqual(15);
        expect(nextTerms).toEqual(["A012", "Airport Code", "Airport Name", "Base Color", "City Name", "Contiguous", "Country Code", "Dom / Int", "Latitude", "Longitude", "Pair Prefix", "State Code", "SWA Station", "Time Zone", "US Customs Clearance"]);
    });
    
    it('should get object defined from QB factory', (): void => {
       expect(QueryBuilderService).toBeDefined();
    });

    it('should get an instance for dependencies services', (): void => {
        expect(QueryBuilderService.$window).toBeDefined();
        expect(QueryBuilderService.informationStorageHelper).toBeDefined();
    });
    
    it('should filter text to get only the new value written', (): void => {
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('=');
        orchestrator.addTerm('AQB');
        let currentText = "Airport Code = ABQ AND";
        var filterValue = QueryBuilderService.filterText(orchestrator, currentText);
        expect(filterValue).toBeDefined();
        expect(filterValue).toEqual('AND');
    });

    it('should filter text to get only the new value written with spaces at the end', (): void => {
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('=');
        orchestrator.addTerm('AQB');
        let currentText = "Airport Code = ABQ AND        ";
        var filterValue = QueryBuilderService.filterText(orchestrator, currentText);
        
        expect(filterValue).toBeDefined();
        expect(filterValue).toEqual('AND');
    });

    it('should filter text when there are less new text than orchestrator text', (): void => {
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('=');
        orchestrator.addTerm('AQB');
        let currentText = "Airport Code = A";
        var filterValue = QueryBuilderService.filterText(orchestrator, currentText);
        
        expect(filterValue).toBeDefined();
        expect(filterValue).toEqual('');
    });

    describe('Test bind all model method', (): void => {
        let modelResult: any;

        it('should bind all text after a selection on typeahead when orchestrator is empty', (): void => {
            modelResult = QueryBuilderService.bindAllModel(orchestrator, '', 'Airport Code', 0);
            expect(modelResult).toBeDefined();
            expect(modelResult.value).toEqual('Airport Code');
            expect(modelResult.position).toEqual(12);
        });

        it('should bind all text after a selection on typeahead when orchestrator has one value added', (): void => {
            orchestrator.addTerm('Airport Code');
            modelResult = QueryBuilderService.bindAllModel(orchestrator, 'Airport Code ', '=', 13);
            expect(modelResult).toBeDefined();
            expect(modelResult.value).toEqual('Airport Code =');
            expect(modelResult.position).toEqual(14);
        });

        it('should bind all text after a selection on typeahead when text is replaced', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            modelResult = QueryBuilderService.bindAllModel(orchestrator, 'Airport Code =', 'Base Color', 0);
            expect(modelResult).toBeDefined();
            expect(modelResult.value).toEqual('Base Color =');
            expect(modelResult.position).toEqual(10);
        });

        it('should bind all text after a selection on typeahead when text is replaced in random position', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            modelResult = QueryBuilderService.bindAllModel(orchestrator, 'Airport Code =', 'Airport Name', 2);
            expect(modelResult).toBeDefined();
            expect(modelResult.value).toEqual('Airport Name =');
            expect(modelResult.position).toEqual(12);
        });
    });

    it('should reset the replace object descriptor', (): void => {
        QueryBuilderService.resetReplaceEvent();
        expect(QueryBuilderService.replaceTerm.value).toEqual('');
        expect(QueryBuilderService.replaceTerm.position).toEqual(-1);
        expect(QueryBuilderService.replaceEvent).toBeFalsy();
    });

    it('should reset last typed query', (): void => {
        QueryBuilderService.resetTypedQuery('Airport Code = ABQ');
        expect(QueryBuilderService.typedQuery).toEqual('Airport Code = ABQ');
    });
    
    it('Should get the initial state for query builder', (): void => {
        var qryState: any = QueryBuilderService.updateQueryState(0, false);
        expect(qryState).toBeDefined();
        expect(qryState.icon).toEqual('fa-times-circle');
        expect(qryState.color).toEqual('#22B557');
        expect(qryState.state).toBeFalsy();
    });
    
    it('Should update the query state when it changes to valid', (): void => {
        var qryState: any = QueryBuilderService.updateQueryState(1, true);      
        expect(qryState).toBeDefined();
        expect(qryState.icon).toEqual('fa-check-circle');
        expect(qryState.color).toEqual('#22B557');
        expect(qryState.state).toBeTruthy();
    });
    
    it('Should update the query state when it changes to not valid', (): void => {
        var qryState: any = QueryBuilderService.updateQueryState(1, false);
        expect(qryState).toBeDefined();
        expect(qryState.icon).toEqual('fa-times-circle');
        expect(qryState.color).toEqual('#B22F36');
        expect(qryState.state).toBeFalsy();
    });

    it('Should get the current state for query builder after update value', (): void => {
        var qryState: any = QueryBuilderService.updateQueryState(0, true);
        expect(qryState).toBeDefined();
        expect(QueryBuilderService.currentValidState.icon).toEqual('fa-times-circle');
        expect(QueryBuilderService.currentValidState.color).toEqual('#22B557');
        expect(QueryBuilderService.currentValidState.state).toBeFalsy();
    });

    it('Should get a valid status query when the user is typing a valid direction in order by statement', (): void => {
        let info: QueryBuilder.IQueryMapKeyboard;
        let fakeInput: HTMLInputElement = <HTMLInputElement>{
            value: '',
            selectionStart: 0,
            selectionEnd: 0
        };
        info = <QueryBuilder.IQueryMapKeyboard>{ e: null, keyCode: 8, isCtrl: false, value: '', field: fakeInput }
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('=');
        orchestrator.addTerm('ABQ');
        orchestrator.addTerm('ORDER BY');
        orchestrator.addTerm('City Name');
        info.field.value = 'Airport Code = ABQ ORDER BY City Name asc';
        info.field.selectionStart = 41;
        info.field.selectionEnd = 41;
        expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
    });

    it('Should get an invalid status query when the user is typing an incomplete direction in order by statement', (): void => {
        let info: QueryBuilder.IQueryMapKeyboard;
        let fakeInput: HTMLInputElement = <HTMLInputElement>{
            value: '',
            selectionStart: 0,
            selectionEnd: 0
        };
        info = <QueryBuilder.IQueryMapKeyboard>{ e: null, keyCode: 8, isCtrl: false, value: '', field: fakeInput }
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('=');
        orchestrator.addTerm('ABQ');
        orchestrator.addTerm('ORDER BY');
        orchestrator.addTerm('City Name');
        info.field.value = 'Airport Code = ABQ ORDER BY City Name as';
        info.field.selectionStart = 40;
        info.field.selectionEnd = 40;
        expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
    });

    describe('test all delete statements inside query string', (): void => {
        let info: QueryBuilder.IQueryMapKeyboard;

        beforeEach((): void => {
            let fakeInput: HTMLInputElement = <HTMLInputElement>{
                value: '',
                selectionStart: 0,
                selectionEnd: 0
            };
            info = <QueryBuilder.IQueryMapKeyboard>{ e: null, keyCode: 8, isCtrl: false, value: '', field: fakeInput }
        });

        it('should not reset terms when delete performed and text typed is greather than text in orchestrator', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            orchestrator.addTerm('ORDER BY');
            orchestrator.addTerm('City Name');
            info.field.value = 'Airport Code = ABQ ORDER BY City Name asc';
            info.field.selectionStart = 41;
            info.field.selectionEnd = 41;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(5);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
            expect(QueryBuilderService.replaceTerm).toBeUndefined();
            expect(QueryBuilderService.replaceEvent).toBeUndefined();
            info.field.value = 'Airport Code = ABQ ORDER BY City Name as';
            info.field.selectionStart = 40;
            info.field.selectionEnd = 40;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should not reset terms when delete performed and position is zero', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            info.field.value = 'Airport Code = ABQ';
            info.field.selectionStart = 0;
            info.field.selectionEnd = 0;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(3);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
            expect(QueryBuilderService.replaceTerm).toBeUndefined();
            expect(QueryBuilderService.replaceEvent).toBeUndefined();
            info.field.value = 'Airport Code = ABQ';
            info.field.selectionStart = 0;
            info.field.selectionEnd = 0;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should not reset terms when delete performed and query string is empty', (): void => {
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(0);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(0);
            expect(QueryBuilderService.replaceTerm).toBeUndefined();
            expect(QueryBuilderService.replaceEvent).toBeUndefined();
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should not reset terms when delete performed and not exist query element in orchestrator', (): void => {
            info.field.value = 'air';
            info.field.selectionStart = 3;
            info.field.selectionEnd = 3;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(0);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(0);
            expect(QueryBuilderService.replaceTerm).toBeUndefined();
            expect(QueryBuilderService.replaceEvent).toBeUndefined();
            info.field.value = 'ai';
            info.field.selectionStart = 2;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should not reset terms when delete performed after a property added and a space as a last char', (): void => {
            orchestrator.addTerm('Airport Code');
            info.field.value = 'Airport Code ';
            info.field.selectionStart = 13;
            info.field.selectionEnd = 13;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(1);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
            expect(QueryBuilderService.replaceTerm).toBeUndefined();
            expect(QueryBuilderService.replaceEvent).toBeUndefined();
            info.field.value = 'Airport Code';
            info.field.selectionStart = 12;
            info.field.selectionEnd = 12;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset terms when delete performed after a property added and no space added', (): void => {
            orchestrator.addTerm('Airport Code');
            info.field.value = 'Airport Code';
            info.field.selectionStart = 12;
            info.field.selectionEnd = 12;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(0);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(0);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(12);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Cod';
            info.field.selectionStart = 11;
            info.field.selectionEnd = 11;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset last term when delete performed after at least two elements added to orchestrator', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            info.field.value = 'Airport Code =';
            info.field.selectionStart = 14;
            info.field.selectionEnd = 14;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(1);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(14);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Code ';
            info.field.selectionStart = 13;
            info.field.selectionEnd = 13;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });
        
        it('should not reset terms when delete performed after a valid query and a space as a last char', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            info.field.value = 'Airport Code = ABQ ';
            info.field.selectionStart = 19;
            info.field.selectionEnd = 19;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(3);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
            expect(QueryBuilderService.replaceTerm).toBeUndefined();
            expect(QueryBuilderService.replaceEvent).toBeUndefined();
            info.field.value = 'Airport Code = ABQ';
            info.field.selectionStart = 18;
            info.field.selectionEnd = 18;
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should reset terms when delete performed after a valid query and delete any part of the last element', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            info.field.value = 'Airport Code = ABQ';
            info.field.selectionStart = 17;
            info.field.selectionEnd = 17;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(17);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Code = AQ';
            info.field.selectionStart = 16;
            info.field.selectionEnd = 16;
            info.value = 'AQ'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should reset terms when delete performed after a valid long query and delete any part at the middle of the query', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            orchestrator.addTerm('Albuquerque');
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.field.selectionStart = 21;
            info.field.selectionEnd = 21;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(3);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual(' City Name = Albuquerque');
            expect(QueryBuilderService.replaceTerm.position).toEqual(21);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Code = ABQ AD City Name = Albuquerque';
            info.field.selectionStart = 20;
            info.field.selectionEnd = 20;
            info.value = 'AD City Name = Albuquerque'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset terms when delete performed after a valid long query and delete any part at the beginning of the query', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            orchestrator.addTerm('Albuquerque');
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.field.selectionStart = 14;
            info.field.selectionEnd = 14;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(1);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual(' ABQ AND City Name = Albuquerque');
            expect(QueryBuilderService.replaceTerm.position).toEqual(14);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Code = ABQ AD City Name = Albuquerque';
            info.field.selectionStart = 20;
            info.field.selectionEnd = 20;
            info.value = 'AD City Name = Albuquerque'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset terms when delete performed after a invalid query and delete first element of the query', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            info.field.value = 'Airport Code = ABQ AND City Name =';
            info.field.selectionStart = 3;
            info.field.selectionEnd = 3;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(0);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(0);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual(' = ABQ AND City Name =');
            expect(QueryBuilderService.replaceTerm.position).toEqual(3);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Aiport Code = ABQ AND City Name =';
            info.field.selectionStart = 2;
            info.field.selectionEnd = 2;
            info.value = 'Aiport Code = ABQ AND City Name ='
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset terms and state should be valid when delete performed after a valid query and delete any part of any value property and value is still valid', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            info.field.value = 'Airport Code = ABQ';
            info.field.selectionStart = 18;
            info.field.selectionEnd = 18;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(18);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Aiport Code = AB';
            info.field.selectionStart = 17;
            info.field.selectionEnd = 17;
            info.value = 'AB'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should reset terms and state should be invalid when delete performed after a valid query and delete any part of any value property and value is not still valid', (): void => {
            orchestrator.addTerm('Contiguous');
            orchestrator.addTerm('=');
            orchestrator.addTerm('false');
            info.field.value = 'Contiguous = false';
            info.field.selectionStart = 18;
            info.field.selectionEnd = 18;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(18);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Contiguous = fals';
            info.field.selectionStart = 17;
            info.field.selectionEnd = 17;
            info.value = 'fals'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset terms when delete performed and there is an active selection of an entire element in any part', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            orchestrator.addTerm('Albuquerque');
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.field.selectionStart = 9;
            info.field.selectionEnd = 39;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(0);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(0);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('ode = ABQ AND City Name = Albu');
            expect(QueryBuilderService.replaceTerm.position).toEqual(9);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Cquerque';
            info.field.selectionStart = 9;
            info.field.selectionEnd = 9;
            info.value = 'Airport Cquerque'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });

        it('should reset terms when delete performed and there is an active selection of text in any part', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ABQ');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            orchestrator.addTerm('Albuquerque');
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.field.selectionStart = 35;
            info.field.selectionEnd = 46;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(6);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('Albuquerque');
            expect(QueryBuilderService.replaceTerm.position).toEqual(35);
            expect(QueryBuilderService.replaceEvent).toBeTruthy();
            info.field.value = 'Airport Code = ABQ AND City Name = ';
            info.field.selectionStart = 35;
            info.field.selectionEnd = 35;
            info.value = ''
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });
    });

    describe('test all query changes statements', (): void => {
        let info: QueryBuilder.IQueryMapKeyboard;
        beforeEach((): void => {
            let fakeInput: HTMLInputElement = <HTMLInputElement>{
                value: '',
                selectionStart: 0,
                selectionEnd: 0
            };
            info = <QueryBuilder.IQueryMapKeyboard>{ e: null, keyCode: 0, isCtrl: false, value: '', field: fakeInput }
        });

        it('should not detect query changes if the query is in orderby statement', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('STARTS WITH');
            orchestrator.addTerm('a');
            orchestrator.addTerm('ORDER BY');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('ASC');
            info.field.value = 'Airport Code STARTS WITH a ORDER BY City Name ASC';
            info.field.selectionStart = 49;
            info.field.selectionEnd = 49;
            QueryBuilderService.detectQueryChanges(info, orchestrator);
            expect(orchestrator.getNextTerms(50)).toEqual([ 'A012', 'Airport Code', 'Airport Name', 'Base Color', 'Contiguous', 'Country Code', 'Dom / Int', 'Latitude', 'Longitude', 'Pair Prefix', 'State Code', 'SWA Station', 'Time Zone', 'US Customs Clearance' ]);
        });

        it('should detect query changes after a delete statement executed in a long query', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('ARQ');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            orchestrator.addTerm('Albuquerque');
            info.field.value = 'Airport Code = ARQ AND City Name = Albuquerque';
            info.field.selectionStart = 17;
            info.field.selectionEnd = 17;
            QueryBuilderService.resetTermsWhenDeletePerformed(info, orchestrator);
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.field.selectionStart = 17;
            info.field.selectionEnd = 17;
            QueryBuilderService.detectQueryChanges(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(7);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
            expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('Airport Code = ABQ AND City Name = Albuquerque');
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(-1);
            expect(QueryBuilderService.replaceEvent).toBeFalsy();
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.field.selectionStart = 17;
            info.field.selectionEnd = 17;
            info.value = 'e'
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should detect query changes in a complementary value of a property and value is the last element', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('AB');
            info.field.value = 'Airport Code = ABQ';
            info.value = 'Q';
            info.field.selectionStart = 18;
            info.field.selectionEnd = 18;
            QueryBuilderService.detectQueryChanges(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(3);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
            expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('Airport Code = ABQ');
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(-1);
            expect(QueryBuilderService.replaceEvent).toBeFalsy();
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should detect query changes in a complementary value of a property and value is the middle element', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('AB');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('City Name');
            orchestrator.addTerm('=');
            orchestrator.addTerm('Albuquerque');
            info.field.value = 'Airport Code = ABQ AND City Name = Albuquerque';
            info.value = 'e';
            info.field.selectionStart = 18;
            info.field.selectionEnd = 18;
            QueryBuilderService.detectQueryChanges(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(7);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
            expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('Airport Code = ABQ AND City Name = Albuquerque');
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(-1);
            expect(QueryBuilderService.replaceEvent).toBeFalsy();
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeTruthy();
        });

        it('should detect query changes in a complementary value of a property and is the last element but is not a valid value', (): void => {
            orchestrator.addTerm('Airport Code');
            orchestrator.addTerm('=');
            orchestrator.addTerm('AB');
            orchestrator.addTerm('AND');
            orchestrator.addTerm('Contiguous');
            orchestrator.addTerm('=');
            orchestrator.addTerm('false');
            info.field.value = 'Airport Code = ABQ AND Contiguous = falsee';
            info.value = 'e';
            info.field.selectionStart = 42;
            info.field.selectionEnd = 42;
            QueryBuilderService.detectQueryChanges(info, orchestrator);
            expect(orchestrator.getQuery().length).toEqual(6);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
            expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('Airport Code = ABQ AND Contiguous =');
            expect(QueryBuilderService.replaceTerm).toBeDefined();
            expect(QueryBuilderService.replaceTerm.value).toEqual('');
            expect(QueryBuilderService.replaceTerm.position).toEqual(-1);
            expect(QueryBuilderService.replaceEvent).toBeFalsy();
            expect(QueryBuilderService.validStatusQuery(info, orchestrator, info.field.selectionStart)).toBeFalsy();
        });
    });

    describe('all test for add term', (): void => {
        it('should add next term and is the first element', (): void => {
            let result: boolean = QueryBuilderService.addNextTerm('Contiguous', 12, orchestrator, false);
            expect(result).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(1);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
        });

        it('should not add next term and is an invalid property', (): void => {
            let result: boolean = QueryBuilderService.addNextTerm('Airport Co', 10, orchestrator, false);
            expect(result).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(0);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(0);
        });

        it('should add next term and is a property with space', (): void => {
            let result: boolean = QueryBuilderService.addNextTerm('Airport Code', 12, orchestrator, false);
            expect(result).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(1);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
        });

        it('should add next term and is an operator as second element', (): void => {
            QueryBuilderService.addNextTerm('Airport Code', 12, orchestrator, false);
            expect(QueryBuilderService.addNextTerm('=', 14, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
        });

        it('should not add term and is an invalid operator', (): void => {
            QueryBuilderService.addNextTerm('Airport Code', 12, orchestrator, false);
            expect(QueryBuilderService.addNextTerm('%', 14, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(1);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(1);
        });

        it('should add next term and is an operator with spaces', (): void => {
            QueryBuilderService.addNextTerm('Airport Code', 12, orchestrator, false);
            expect(QueryBuilderService.addNextTerm('STARTS WITH', 24, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
        });

        it('should add next term and is a common valid value', (): void => {
            QueryBuilderService.addNextTerm('Airport Code', 12, orchestrator, false);
            QueryBuilderService.addNextTerm('=', 14, orchestrator, false);
            expect(QueryBuilderService.addNextTerm('ABQ', 18, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(3);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
        });

        it('should not add next term and is a common invalid value', (): void => {
            QueryBuilderService.addNextTerm('Contiguous', 10, orchestrator, false);
            QueryBuilderService.addNextTerm('=', 12, orchestrator, false);
            expect(QueryBuilderService.addNextTerm('fals', 17, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(2);
        });

        it('should add next term and is a IN valid values', (): void => {
            QueryBuilderService.addNextTerm('Airport Code', 12, orchestrator, false);
            QueryBuilderService.addNextTerm('IN', 15, orchestrator, false);
            expect(QueryBuilderService.addNextTerm("'ABQ ALB'", 23, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(4);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
        });

        it('should not add next term and is IN invalid values', (): void => {
            QueryBuilderService.addNextTerm('Latitude', 8, orchestrator, false);
            QueryBuilderService.addNextTerm('IN', 11, orchestrator, false);
            expect(QueryBuilderService.addNextTerm("'90 ALB'", 15, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(5);
        });

        it('should not add next term and is IN values with one value', (): void => {
            QueryBuilderService.addNextTerm('Latitude', 8, orchestrator, false);
            QueryBuilderService.addNextTerm('IN', 11, orchestrator, false);
            expect(QueryBuilderService.addNextTerm("'90'", 14, orchestrator, false)).toBeFalsy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(5);
        });

        it('should add next term and is a RANGE valid values', (): void => {
            QueryBuilderService.addNextTerm('Latitude', 8, orchestrator, false);
            QueryBuilderService.addNextTerm('BETWEEN', 15, orchestrator, false);
            expect(QueryBuilderService.addNextTerm("'-80 180'", 20, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(4);
            expect(orchestrator.isValidQuery()).toBeTruthy();
            expect(orchestrator.getCurrentState()).toEqual(3);
        });

        it('should not add next term and is a RANGE invalid values', (): void => {
            QueryBuilderService.addNextTerm('Latitude', 8, orchestrator, false);
            QueryBuilderService.addNextTerm('BETWEEN', 15, orchestrator, false);
            expect(QueryBuilderService.addNextTerm("'-80 ABQ'", 20, orchestrator, false)).toBeTruthy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(5);
        });

        it('should not add next term and is RANGE with more than two values', (): void => {
            QueryBuilderService.addNextTerm('Latitude', 8, orchestrator, false);
            QueryBuilderService.addNextTerm('BETWEEN', 15, orchestrator, false);
            expect(QueryBuilderService.addNextTerm("'-80 180 360'", 20, orchestrator, false)).toBeFalsy();
            expect(orchestrator.getQuery().length).toEqual(2);
            expect(orchestrator.isValidQuery()).toBeFalsy();
            expect(orchestrator.getCurrentState()).toEqual(5);
        });
    });

    it('should not add next term when value is empty and is a valid query', (): void => {
        let info: QueryBuilder.IQueryMapKeyboard;
        let fakeInput: HTMLInputElement = <HTMLInputElement>{
            value: '',
            selectionStart: 0,
            selectionEnd: 0
        };
        info = <QueryBuilder.IQueryMapKeyboard>{ e: null, keyCode: 0, isCtrl: false, value: '', field: fakeInput };
        QueryBuilderService.replaceEvent = true;
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('STARTS WITH');
        orchestrator.addTerm('a');
        orchestrator.addTerm('ORDER BY');
        orchestrator.addTerm('City Name');
        orchestrator.addTerm('ASC');
        info.field.value = 'Airport Code STARTS WITH a ORDER BY City Name ASC';
        info.field.selectionStart = 49;
        info.field.selectionEnd = 49;
        let result = QueryBuilderService.addNextTerm('', 49, orchestrator, false);
        expect(result).toBeDefined();
        expect(result).toBeTruthy();
        expect(orchestrator.getCurrentState()).toEqual(0);
    });

    it('should handle open window', (): void => {
        spyOn(QueryBuilderService.$window, 'open').and.callFake(() => {
            return true;
        });
        QueryBuilderService.handleOpenWindow(true, (): any => { return (): any => { return { url: 'api/some/test', name: 'test', size: 900 } }; });
    });

    it('should valid delete status for query', (): void => {
        let info: QueryBuilder.IQueryMapKeyboard;
        let fakeInput: HTMLInputElement = <HTMLInputElement>{
            value: '',
            selectionStart: 0,
            selectionEnd: 0
        };
        info = <QueryBuilder.IQueryMapKeyboard>{ e: null, keyCode: 0, isCtrl: false, value: '', field: fakeInput }
        expect(QueryBuilderService.validDeleteStatusQuery(info, 0, '')).toBeTruthy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 1, '')).toBeTruthy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 4, '')).toBeTruthy();
        info.field.value = 'Airport Code = ABQ';
        expect(QueryBuilderService.validDeleteStatusQuery(info, 2, 'Airport Code = ABQ')).toBeTruthy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 3, 'Airport Code = ABQ')).toBeTruthy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 5, 'Airport Code = ABQ')).toBeTruthy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 2, 'Airport Code = ')).toBeFalsy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 3, 'Airport Code = ')).toBeFalsy();
        expect(QueryBuilderService.validDeleteStatusQuery(info, 5, 'Airport Code = ')).toBeFalsy();
    });

    it('should reset icon state', (): void => {
        expect(QueryBuilderService.validResetIconState(0, '')).toBeTruthy();
        expect(QueryBuilderService.validResetIconState(0, 'test')).toBeFalsy();
        expect(QueryBuilderService.validResetIconState(3, '')).toBeFalsy();
        expect(QueryBuilderService.validResetIconState(3, 'test')).toBeFalsy();
    });

    it('should valid query multiple values delete', (): void => {
        expect(QueryBuilderService.validQueryMultipleValuesDelete(3, 5)).toBeTruthy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(3, 3)).toBeTruthy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(2, 5)).toBeFalsy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(2, 3)).toBeFalsy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(2, 2)).toBeFalsy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(1, 1)).toBeFalsy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(4, 4)).toBeFalsy();
        expect(QueryBuilderService.validQueryMultipleValuesDelete(5, 5)).toBeFalsy();
    });

    it('should valid if must search', (): void => {
        QueryBuilderService.replaceEvent = false;
        expect(QueryBuilderService.validShouldSearch(true, true, 0)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, true, 2)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, true, 3)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, true, 5)).toBeTruthy();

        expect(QueryBuilderService.validShouldSearch(true, false, 2)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, false, 3)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, false, 5)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, false, 2)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, false, 3)).toBeTruthy();

        expect(QueryBuilderService.validShouldSearch(false, true, 0)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, true, 2)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, true, 3)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, true, 5)).toBeFalsy();

        expect(QueryBuilderService.validShouldSearch(true, false, 0)).toBeFalsy();

        expect(QueryBuilderService.validShouldSearch(true, true, 1)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, true, 1)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(true, false, 1)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(true, true, 4)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, true, 4)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(true, false, 4)).toBeFalsy();

        expect(QueryBuilderService.validShouldSearch(false, false, 0)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, false, 2)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, false, 3)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(false, false, 5)).toBeFalsy();

        QueryBuilderService.replaceEvent = true;
        expect(QueryBuilderService.validShouldSearch(true, true, 2)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, true, 5)).toBeTruthy();
        expect(QueryBuilderService.validShouldSearch(true, true, 0)).toBeFalsy();
        expect(QueryBuilderService.validShouldSearch(true, true, 3)).toBeFalsy();
    });

    it('should handle copy query', (): void => {
        QueryBuilderService.handleCopiedText(<HTMLTextAreaElement>{ value: 'Airport Code = abq', selectionStart: 4 }, orchestrator);
        expect(orchestrator.getQuery().length).toEqual(3);
        expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('Airport Code = abq');
    });

    it('should handle copy partial query to a current value at the end of that value', (): void => {
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('STARTS WITH');
        orchestrator.addTerm('a');
        QueryBuilderService.handleCopiedText(<HTMLTextAreaElement>{ value: 'Airport Code STARTS WITH a AND State Code ENDS WITH x', selectionStart: 53 }, orchestrator);
        expect(orchestrator.getQuery().length).toEqual(7);
        expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('Airport Code STARTS WITH a AND State Code ENDS WITH x');
    });

    it('should handle copy partial query to a current value at the beginning of the value', (): void => {
        orchestrator.addTerm('Airport Code');
        orchestrator.addTerm('STARTS WITH');
        orchestrator.addTerm('a');
        QueryBuilderService.handleCopiedText(<HTMLTextAreaElement>{ value: 'State Code ENDS WITH x AND Airport Code STARTS WITH a ', selectionStart: 27 }, orchestrator);
        expect(orchestrator.getQuery().length).toEqual(7);
        expect(QueryBuilderService.getTermsJoined(orchestrator)).toEqual('State Code ENDS WITH x AND Airport Code STARTS WITH a');
    });
});
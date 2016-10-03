require('es6-shim');
var orchestratorObject_1: any = require('directives/queryBuilder/core/orchestratorObject.js');

describe('Orchestrator QueryBuilder', () => {
    let orchestrator;
    let currentPrimitiveOperators = ["=", "IS", "!=", "!IS", "IS NOT", "<>"];
    let currentAdvancedOperators = ["IN", "==", "!IN", "NOT IN", "!=="];
    let currentNumericOperators = Array.prototype.concat(currentPrimitiveOperators, currentAdvancedOperators.concat([">", ">=", "<", "<=", "BETWEEN"]))
    let currentValidConcatOperators =["AND", "*", "OR", "+", "ORDER BY"];
    let currentValidBooleanOperators = ["=", "IS"];
    let queryValid_NOB = [
        {
            nextTerms: ["ADG","AM/PM","Base","BLK","DHR","Dow","DPM","Duty"],
            position: { start: 0, end: 4 },
            previousLength: -1,
            propType: "INTEGER",
            term: "pairingNumber",
            text: "Pg #",
            type: 1
        },
        {
            nextTerms: ["=","IS","!=","!IS","IS NOT","<>","IN","==","!IN","NOT IN","!==",">",">=","<","<=","BETWEEN"],
            position: { start: 5, end: 6 },
            previousLength: 4,
            propType: "INTEGER",
            term: "=",
            text: "=",
            type: 2
        },
        {
            nextTerms: [],
            position: { start: 7, end: 8 },
            previousLength: 6,
            propType: "INTEGER",
            term: "1",
            text: "1",
            type: 3
        }
    ];
    let propertyMap_NOB =  {
                pairingNumber: { name: "Pg #", type: "INTEGER" },
                baseStationCode: { name: "Base", type: "STRING" },
                daytimeCategoryType: { name: "AM/PM", type: "STRING" }
    };

    let queryValid_OB = [
        {
            "term":"problemType","type":1,"text":"Type","propType":"STRING","previousLength":-1,
            "nextTerms":["Category","Created By First Name","Created By Last Name","End Date","Name","Progress","Scenario ID","Solutions","Start Date","Status","Submitted Date Time","Type"],
            "position":{"start":0,"end":4}
        },
        {
            "term":"=","type":2,"text":"=","propType":"STRING","previousLength":4,
            "nextTerms":["=","IS","!=","!IS","IS NOT","<>","IN","==","!IN","NOT IN","!==","STARTS WITH","ENDS WITH","CONTAINS","!CONTAINS","BETWEEN"],
            "position":{"start":5,"end":6}
        },
        {
            "term":"'section'","type":3,"text":"'SECTION'","propType":"STRING","previousLength":6,
            "nextTerms":[],
            "position":{"start":7,"end":16}
        },
        {
            "term":"ORDER BY","type":4,"text":"ORDER BY","propType":"STRING","previousLength":16,
            "nextTerms":["AND","*","OR","+","ORDER BY"],
            "position":{"start":17,"end":25}
        },
        {
            "term":"startDate","type":1,"text":"Start Date","propType":"DATE","previousLength":25,
            "nextTerms":["Category","Created By First Name","Created By Last Name","End Date","Name","Progress","Scenario ID","Solutions","Start Date","Status","Submitted Date Time","Type"],
            "position":{"start":26,"end":36}
        },
        {
            "term":"ASC","type":0,"text":"ASC","propType":"DATE","previousLength":36,
            "nextTerms":["ASC","DESC"],
            "position":{"start":37,"end":40}
        }
    ];    
    let propertyMap_OB =  {
                "id":{"name":"Scenario ID","type":"INTEGER"},
                "scenarioName":{"name":"Name","type":"STRING"},
                "problemType":{"name":"Type","type":"STRING"},
                "startDate":{"name":"Start Date","type":"DATE"},
                "endDate":{"name":"End Date","type":"DATE"},
                "dposCategory.name":{"name":"Category","type":"STRING"},
                "dposStart":{"name":"Submitted Date Time","type":"DATETIME"},
                "currentCrewPlanner.firstName":{"name":"Created By First Name","type":"STRING"},
                "currentCrewPlanner.lastName":{"name":"Created By Last Name","type":"STRING"},
                "scenarioStatusType":{"name":"Status","type":"STRING"},
                "solutionsProgress":{"name":"Progress","type":"INTEGER"},
                "numberOfSolutions":{"name":"Solutions","type":"INTEGER"}
    };

    let queryWithoutValue = [
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
            position: { start: 0, end: 4 },
            previousLength: -1,
            propType: "INTEGER",
            term: "pairingNumber",
            text: "Pg #",
            type: 1
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
            position: { start: 5, end: 6 },
            previousLength: 4,
            propType: "INTEGER",
            term: "=",
            text: "=",
            type: 2
        }
    ];
    let queryWithConcat = {
        term:"AND",
        type:4,
        text:"AND",
        propType:"INTEGER",
        previousLength:8,
        nextTerms:["AND","*","OR","+","ORDER BY"],
        position:{"start":9,"end":12}
    };
    let baseProperty = {
        term:"baseStationCode",
        type:1,
        text:"Base",
        propType:"STRING",
        previousLength:12,
        nextTerms:["ADG","AM/PM","Base"],
        position:{start:13,end:17}
    };

    function OrchestratorOB(){
        return OrchestratorInstance(propertyMap_OB);
    }
    function OrchestratorNOB(){
        return OrchestratorInstance(propertyMap_NOB);
    }

    function OrchestratorInstance( _propertyMap) {
            let Orchestrator = new orchestratorObject_1.query.core.Orchestrator(_propertyMap);
            Orchestrator.state = 0;
            Orchestrator.valid = 0;
            Orchestrator.type = '';
            Orchestrator.dateFormat = 'YYYY-MM-DD';
            Orchestrator.dateTimeFormat = 'YYYY-MM-DDTHH:mm';
            Orchestrator.dateTimeHourMinFormat = 'YYYY-MM-DDTHH:mm:ss';
            Orchestrator.dateTimeMillisecondsFormat = 'YYYY-MM-DDTHH:mm:ss.SSSS';
            Orchestrator.ADVANCED_NEGATIVE_OPS = ["!IN", "NOT IN", "!=="];
            Orchestrator.SPECIFIED_OPS = ["BETWEEN"];
            Orchestrator.ADVANCED_OPS = ["IN", "=="].concat(Orchestrator.ADVANCED_NEGATIVE_OPS);
            Orchestrator.query = new Array();
            Orchestrator.concatOps = ["AND", "*", "OR", "+", "ORDER BY"];
            Orchestrator.ORDER_BY = 'ORDER BY';
            Orchestrator.propertyTerms = new Array();
            Orchestrator.propertyMap = _propertyMap;
            Orchestrator.operatorMap = {
                "BOOLEAN": ["=", "IS"],
                "DATE": ["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", "BETWEEN"],
                "DATETIME": ["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", "BETWEEN"],
                "DATE_RANGE": ["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", "BETWEEN", ">", ">=", "<", "<="],
                "INTEGER": ["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", ">", ">=", "<", "<=", "BETWEEN"],
                "REAL": ["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", ">", ">=", "<", "<=", "BETWEEN"],
                "STRING": ["=", "IS", "!=", "!IS", "IS NOT", "<>", "IN", "==", "!IN", "NOT IN", "!==", "STARTS WITH", "ENDS WITH", "CONTAINS", "!CONTAINS", "BETWEEN"]
            };
            Orchestrator.setPropertyTerms();
            Orchestrator.ensureMappingObjects(Orchestrator.concatOps || Orchestrator.getConcatOperatorsConfig());
            Orchestrator.nextTerms = Orchestrator.propertyTerms;
            return Orchestrator;
    };
    
    beforeEach(() => {
        orchestrator = OrchestratorNOB();
    });

    it('TS: should get instance of orchestrator', function () {
        expect(orchestrator).toBeDefined();
        expect(orchestrator.getCurrentState()).toBeDefined();
        expect(orchestrator.getCurrentState()).toBe(0);
        expect(orchestrator.getNextTerms()).toBeDefined();
        expect(orchestrator.getNextTerms().length).toBe(3);
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery()).toEqual(new Array());
        expect(orchestrator.getQuery().length).toBe(0);
    });

    it('TS: should be a valid query', () => {
        expect(orchestrator.addTerm).toBeDefined();
        expect(orchestrator.isValidQuery).toBeDefined();
        expect(orchestrator.getCurrentState).toBeDefined();
        expect(orchestrator.getCurrentState()).toBe(0);
        queryValid_NOB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.isValidQuery()).toEqual(true);        
    });

    it('TS: should remove term from a query with value', () => {
        queryValid_NOB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(3);
        let removeTerm = orchestrator.removeTerm();
        expect(removeTerm).toEqual(2);
        expect(orchestrator.getQuery().length).toBe(2);
    });

    it('TS: should remove term from a query with a concat', () => {
        queryValid_NOB.push(queryWithConcat);
        queryValid_NOB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(4);
        let removeTerm = orchestrator.removeTerm();
        expect(removeTerm).toEqual(3);
        expect(orchestrator.getQuery().length).toBe(3);
    });

    it('TS: should remove term from a query with two properties', () => {
        queryValid_NOB.push(queryWithConcat);
        queryValid_NOB.push(baseProperty);
        queryValid_NOB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(5);
        let removeTerm = orchestrator.removeTerm();
        expect(removeTerm).toEqual(4);
        expect(orchestrator.getQuery().length).toBe(4);
    });

    it('TS: should remove term from a query without value', () => {
        queryWithoutValue.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(2);
        let removeTerm = orchestrator.removeTerm();
        expect(removeTerm).toEqual(1);
        expect(orchestrator.getQuery().length).toBe(1);
    });
    it('TS: should validate query state', () => {
        orchestrator = OrchestratorOB();
        expect(orchestrator.getCurrentState()).toBe(0);
        queryValid_OB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.getCurrentState()).toBe(0);
        expect(orchestrator.getPreviousState()).toBe(1);
        expect(orchestrator.isAdvancedState()).toBe(false);     
        expect(orchestrator.getIsOrderBy ()).toBe(true);   
    });

    it('TS: should remove from index', () => {
        orchestrator = OrchestratorOB();
        expect(orchestrator.getCurrentState()).toBe(0);
        queryValid_OB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.removeFromIndex(4)).toBe(4);       
    });

    it('TS: should remove all terms', () => {
        orchestrator = OrchestratorOB();
        expect(orchestrator.getCurrentState()).toBe(0);
        queryValid_OB.forEach(function (x) {
            orchestrator.addTerm(x.text);
        });
        expect(orchestrator.getQuery().length).not.toBe(0);
        orchestrator.removeAllTerms();
        expect(orchestrator.getQuery().length).toBe(0);
    }); 
    
    it('TS: should add new term', function () {
        expect(orchestrator.getNextTerms()).toEqual(orchestrator.nextTerms);
        expect(orchestrator.addTerm('Pg #')).toBe(1);
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(1);
        expect(orchestrator.getQuery().map(function(x) { return x.text; }).join(' ')).toEqual('Pg #');
    });
    it('TS: should delete an existing term', function () {
        expect(orchestrator.getNextTerms()).toEqual(orchestrator.nextTerms);
        expect(orchestrator.addTerm('Pg #')).toBe(1);
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(1);
        expect(orchestrator.getQuery().map(function(x) { return x.text; }).join(' ')).toEqual('Pg #');
        expect(orchestrator.removeTerm()).toBe(0);
        expect(orchestrator.getQuery()).toEqual(new Array());
        expect(orchestrator.getQuery().length).toBe(0);
    });
    it('TS: should get the next term available by property type', function () {

        expect(orchestrator.addTerm('Pg #')).toBe(1);
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(1);
        expect(orchestrator.getQuery().map(function(x) { return x.text; }).join(' ')).toEqual('Pg #');
        expect(orchestrator.getNextTerms()).toBeDefined();
        expect(orchestrator.getNextTerms()).toEqual(currentNumericOperators);
        expect(orchestrator.addTerm('=')).toBe(2);
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(2);
        expect(orchestrator.getQuery().map(function(x) { return x.text; }).join(' ')).toEqual('Pg # =');
        expect(orchestrator.getNextTerms()).toBeDefined();
        expect(orchestrator.getNextTerms()).toEqual([]);
        expect(orchestrator.addTerm('5')).toBe(3);
        expect(orchestrator.getQuery()).toBeDefined();
        expect(orchestrator.getQuery().length).toEqual(3);
        expect(orchestrator.getQuery().map(function(x) { return x.text; }).join(' ')).toEqual('Pg # = 5');        
    });  
});

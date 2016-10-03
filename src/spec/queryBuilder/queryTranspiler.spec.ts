var queryTranspiler_1: any = require('directives/queryBuilder/core/queryTranspiler.js');
var queryElement_1: any = require('directives/queryBuilder/core/queryElement.js');
var test;

describe('Transpiler QueryBuilder', function () {
    var objTranspiler;
    var testClass;
    
    function ESTranspilerTest()  {
        let transpileQuery = new queryTranspiler_1.transpiler.core.ESQueryTranspiler();
        transpileQuery.lastState = 0;
        transpileQuery.concatOpInValues = " OR ";
        transpileQuery.concatNorInValues = " AND NOT ";
        transpileQuery.concatOpBetweenValues = " TO ";
        transpileQuery.concatStartsWith = "*";
        transpileQuery.concatNotContains = "*)";
        transpileQuery.advancedOps = ["IN", "==", "BETWEEN"];
        transpileQuery.advancedNegativeOps = ["!IN", "NOT IN", "!=="];
        transpileQuery.negativeOps = ["!=", "!IS", "IS NOT", "<>"];
        return transpileQuery;
    };
    
    beforeEach(function () {
        objTranspiler = ESTranspilerTest();
    });
    it('TS: should get instance of transpiler', function () {
        expect(objTranspiler).toBeDefined();
    });
    it('TS: should transpile a date query to ES Syntax as a datetime range', function () {
        var elements = [
            new queryElement_1.QueryElement("date", 1, "date"),
            new queryElement_1.QueryElement("=", 2, "="),
            new queryElement_1.QueryElement("2016-01-01", 3, "2016-01-01"),
        ];
        expect(objTranspiler.transpileQuery(elements)).toBeDefined();
        expect(objTranspiler.transpileQuery(elements)).toEqual("date:+[2016\\-01\\-01T00\\:00\\:00 TO 2016\\-01\\-01T23\\:59\\:59]");
    });
    it('TS: should transpile a BETWEEN date query to ES Syntax as a datetime range', function () {
        var elements = [
            new queryElement_1.QueryElement("date", 1, "date"),
            new queryElement_1.QueryElement("BETWEEN", 5, "BETWEEN"),
            new queryElement_1.QueryElement("2016-01-01", 3, "2016-01-01"),
            new queryElement_1.QueryElement("2016-02-01", 3, "2016-02-01"),
        ];
        expect(objTranspiler.transpileQuery(elements)).toBeDefined();
        expect(objTranspiler.transpileQuery(elements)).toEqual("date:[2016\\-01\\-01T00\\:00\\:00 TO 2016\\-02\\-01T23\\:59\\:59]");
    });
    it('TS: should transpile a query to ES Syntax', function () {
        var elements = [
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement(">", 2, ">"),
            new queryElement_1.QueryElement("4", 3, "4"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("isFemenine", 1, "isFemenine"),
            new queryElement_1.QueryElement("=", 2, "="),
            new queryElement_1.QueryElement("true", 3, "true")
        ];
        expect(objTranspiler.transpileQuery(elements)).toBeDefined();
        expect(objTranspiler.transpileQuery(elements)).toEqual("id:>4 AND isFemenine:+true");
    });
    it('TS: should transpile a query to ES Syntax With All Operators', function () {
        var elements = [
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement(">", 2, ">"),
            new queryElement_1.QueryElement("4", 3, "4"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("isFemenine", 1, "isFemenine"),
            new queryElement_1.QueryElement("=", 2, "="),
            new queryElement_1.QueryElement("true", 3, "true"),
            new queryElement_1.QueryElement("OR", 4, "OR"),
            new queryElement_1.QueryElement("arrivalStation", 1, "arrivalStation"),
            new queryElement_1.QueryElement("IS", 2, "IS"),
            new queryElement_1.QueryElement("ABC", 3, "ABC"),
            new queryElement_1.QueryElement("*", 4, "*"),
            new queryElement_1.QueryElement("isFemenine", 1, "isFemenine"),
            new queryElement_1.QueryElement("=", 2, "="),
            new queryElement_1.QueryElement("false", 3, "false"),
            new queryElement_1.QueryElement("+", 4, "+"),
            new queryElement_1.QueryElement("isFemenine", 1, "isFemenine"),
            new queryElement_1.QueryElement("=", 2, "="),
            new queryElement_1.QueryElement("false", 3, "false"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("isFemenine", 1, "isFemenine"),
            new queryElement_1.QueryElement("IS", 2, "IS"),
            new queryElement_1.QueryElement("true", 3, "true"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("isFemenine", 1, "isFemenine"),
            new queryElement_1.QueryElement("IS", 2, "IS"),
            new queryElement_1.QueryElement("false", 3, "false"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement(">", 2, ">"),
            new queryElement_1.QueryElement("5", 3, "5"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement("<", 2, "<"),
            new queryElement_1.QueryElement("5", 3, "5"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement(">=", 2, ">="),
            new queryElement_1.QueryElement("5", 3, "5"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement("<=", 2, "<="),
            new queryElement_1.QueryElement("5", 3, "5"),
            new queryElement_1.QueryElement("AND", 4, "AND"),
            new queryElement_1.QueryElement("id", 1, "id"),
            new queryElement_1.QueryElement("ENDS WITH", 2, "ENDS WITH"),
            new queryElement_1.QueryElement("SUFFIX", 3, "SUFFIX"),
        ];
        expect(objTranspiler.transpileQuery(elements)).toBeDefined();
        var stringExpect = "id:>4 AND isFemenine:+true OR arrivalStation:+ABC AND isFemenine:+false OR isFemenine:+false AND isFemenine:+true AND isFemenine:+false" +
            " AND id:>5 AND id:<5 AND id:>=5 AND id:<=5 AND id:*SUFFIX";
        expect(objTranspiler.transpileQuery(elements)).toEqual(stringExpect);
    });
});

"use strict";
var queryState_1 = require('./queryState');
var transpiler;
(function (transpiler) {
    var core;
    (function (core) {
        var ESQueryTranspiler = (function () {
            function ESQueryTranspiler() {
                this.lastState = queryState_1.QueryState.INITIAL;
                this.concatOpInValues = " OR ";
                this.concatNorInValues = " AND NOT ";
                this.concatOpBetweenValues = " TO ";
                this.concatStartsWith = "*";
                this.concatNotContains = "*)";
                this.advancedOps = ["IN", "==", "BETWEEN"];
                this.advancedNegativeOps = ["!IN", "NOT IN", "!=="];
                this.negativeOps = ["!=", "!IS", "IS NOT", "<>"];
                this.STARTS_WITH = 'STARTS WITH';
                this.BETWEEN = 'BETWEEN';
                this.CONTAINS = 'CONTAINS';
                this.NOT_CONTAINS = '!CONTAINS';
                this.DATE_RANGE = 'DATE_RANGE';
            }
            ESQueryTranspiler.prototype.transpileQuery = function (elements) {
                var _this = this;
                var query = "";
                elements.forEach(function (element, idx) {
                    element.term = element.term.replace(/\'/g, '');
                    switch (element.type) {
                        case queryState_1.QueryState.INITIAL:
                            query += _this.parseOperator(element.term.toUpperCase());
                            break;
                        case queryState_1.QueryState.PROPERTY_TERM:
                            _this.hasNegativeOps = _this.hasAdvancedOps = false;
                            _this.isDateRange = element.propType === _this.DATE_RANGE;
                            query += element.term;
                            break;
                        case queryState_1.QueryState.OPERATOR_TERM:
                        case queryState_1.QueryState.CONCAT_TERM:
                        case queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES:
                            _this.isNegativeNotForRange = _this.negativeOps.indexOf(element.term.toUpperCase()) > -1;
                            if (element.type === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES) {
                                _this.hasNegativeOps = _this.advancedNegativeOps.indexOf(element.term.toUpperCase()) > -1;
                                _this.hasAdvancedOps = _this.advancedOps.indexOf(element.term.toUpperCase()) > -1;
                            }
                            query += (element.type === queryState_1.QueryState.CONCAT_TERM && (_this.hasAdvancedOps || _this.hasNegativeOps) ? _this.isBetweenSecond ? ']' : ')' : '')
                                + _this.parseOperator(element.term.toUpperCase());
                            break;
                        case queryState_1.QueryState.PROPERTY_VALUE:
                            _this.isBetweenFirst = elements[(idx - 1)].text === _this.BETWEEN;
                            _this.isBetweenSecond = elements[(idx - 1) - 1].text === _this.BETWEEN;
                            query += _this.getQuerySyntaxWhenIsPropValue(element, elements[idx - 1], elements[(idx - 1) - 1]);
                            break;
                    }
                });
                return query +
                    (elements[elements.length - 1].type === queryState_1.QueryState.PROPERTY_VALUE && (this.hasAdvancedOps || this.hasNegativeOps) ? this.isBetweenSecond ? ']' : ')' : '');
            };
            ESQueryTranspiler.prototype.getQuerySyntaxWhenIsPropValue = function (element, lastElement, preLastElement) {
                return this.validSyntaxPropertyValue(lastElement, preLastElement) + this.parseEscaping(element.term) + this.validSyntaxOperatorValue(lastElement);
            };
            ESQueryTranspiler.prototype.validSyntaxPropertyValue = function (lastElement, preLastElement) {
                if (lastElement.type !== queryState_1.QueryState.PROPERTY_VALUE)
                    return '';
                if (preLastElement.text === this.BETWEEN)
                    return this.concatOpBetweenValues;
                if (this.hasNegativeOps)
                    return this.concatNorInValues;
                return this.concatOpInValues;
            };
            ESQueryTranspiler.prototype.validSyntaxOperatorValue = function (lastElement) {
                if (lastElement.term.toUpperCase() === this.NOT_CONTAINS)
                    return this.concatNotContains;
                if (lastElement.term.toUpperCase() === this.STARTS_WITH || lastElement.term.toUpperCase() === this.CONTAINS)
                    return this.concatStartsWith;
                if (this.isNegativeNotForRange)
                    return ')';
                return '';
            };
            ESQueryTranspiler.prototype.parseEscaping = function (query) {
                var chars = ["+", "&&", "||", "-", "!", "(", ")", "{", "}", "[", "]", "^", "\"", "~", "\\", ":", "/"];
                for (var c in chars) {
                    query = query.split(chars[c]).join("\\" + chars[c]).replace(/\\\\/g, '\\');
                }
                if (/\d\d\d\d-\d\d-\d\d$/g.test(query.replace(/\\/g, ''))) {
                    if (this.isBetweenFirst)
                        return query + "T00\\:00\\:00";
                    if (this.isBetweenSecond)
                        return query + "T23\\:59\\:59";
                    if (!(this.isDateRange))
                        return "[" + query + "T00\\:00\\:00 TO " + query + "T23\\:59\\:59]";
                    else if (this.isNegativeNotForRange)
                        return '"' + query + '"';
                }
                if (/\s/g.test(query))
                    return '"' + query + '"';
                return query;
            };
            ESQueryTranspiler.prototype.parseOperator = function (operator) {
                var mapOperators = {
                    "=": ":+",
                    "IS": ":+",
                    "!=": ":(NOT ",
                    "!IS": ":(NOT ",
                    "IS NOT": ":(NOT ",
                    "<>": ":(NOT ",
                    ">": ":>",
                    "<": ":<",
                    ">=": ":>=",
                    "<=": ":<=",
                    "STARTS WITH": ":",
                    "ENDS WITH": ":*",
                    "CONTAINS": ":+*",
                    "!CONTAINS": ":(* AND NOT *",
                    "IN": ":(",
                    "==": ":(",
                    "BETWEEN": ":[",
                    "!IN": ":(* AND NOT ",
                    "NOT IN": ":(* AND NOT ",
                    "!==": ":(* AND NOT ",
                    "AND": " AND ",
                    "OR": " OR ",
                    "*": " AND ",
                    "+": " OR ",
                    "ORDER BY": "&sort=",
                    "ASC": ",ASC&",
                    "DESC": ",DESC&"
                };
                return mapOperators[operator];
            };
            return ESQueryTranspiler;
        }());
        core.ESQueryTranspiler = ESQueryTranspiler;
    })(core = transpiler.core || (transpiler.core = {}));
})(transpiler = exports.transpiler || (exports.transpiler = {}));

//# sourceMappingURL=queryTranspiler.js.map

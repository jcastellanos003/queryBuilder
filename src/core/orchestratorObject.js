"use strict";
var queryElement_1 = require('./queryElement');
var queryState_1 = require('./queryState');
var query;
(function (query_1) {
    var core;
    (function (core) {
        var Types = (function () {
            function Types() {
            }
            Object.defineProperty(Types, "REAL", {
                get: function () { return "REAL"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "INTEGER", {
                get: function () { return "INTEGER"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "STRING", {
                get: function () { return "STRING"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "DATE", {
                get: function () { return "DATE"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "DATETIME", {
                get: function () { return "DATETIME"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "DATE_RANGE", {
                get: function () { return "DATE_RANGE"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "BOOLEAN", {
                get: function () { return "BOOLEAN"; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Types, "RANGE", {
                get: function () { return "RANGE"; },
                enumerable: true,
                configurable: true
            });
            ;
            return Types;
        }());
        core.Types = Types;
        var JavascriptTypes = (function () {
            function JavascriptTypes() {
            }
            Object.defineProperty(JavascriptTypes, "STRING", {
                get: function () { return "string"; },
                enumerable: true,
                configurable: true
            });
            ;
            return JavascriptTypes;
        }());
        var Orchestrator = (function () {
            function Orchestrator(propertyMap, operatorMap, concatOps) {
                this.state = queryState_1.QueryState.INITIAL;
                this.valid = 0;
                this.type = '';
                this.dateFormat = 'YYYY-MM-DD';
                this.dateTimeFormat = 'YYYY-MM-DDTHH:mm';
                this.dateTimeHourMinFormat = 'YYYY-MM-DDTHH:mm:ss';
                this.dateTimeMillisecondsFormat = 'YYYY-MM-DDTHH:mm:ss.SSSS';
                this.ADVANCED_NEGATIVE_OPS = ["!IN", "NOT IN", "!=="];
                this.SPECIFIED_OPS = ["BETWEEN"];
                this.ORDER_BY = 'ORDER BY';
                this.ADVANCED_OPS = ["IN", "=="].concat(this.ADVANCED_NEGATIVE_OPS);
                this.query = new Array();
                this.concatOps = new Array();
                this.propertyTerms = new Array();
                this.propertyMap = propertyMap;
                this.operatorMap = operatorMap || this.getOperatorsConfig();
                this.setPropertyTerms();
                this.ensureMappingObjects(concatOps || this.getConcatOperatorsConfig());
                this.nextTerms = this.propertyTerms;
            }
            Orchestrator.prototype.addTerm = function (term) {
                var _this = this;
                if ((this.state === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES && this.validValues(term))
                    || (this.state === queryState_1.QueryState.PROPERTY_VALUE && this.validateValuesNoConcatOperators(term))
                    || (this.state === queryState_1.QueryState.OPERATOR_TERM && this.validateValue(term))
                    || this.validateTerm(term)) {
                    this.previousTerms = this.nextTerms;
                    this.queryProp = term;
                    this.valid = 0;
                    if (this.setNextState(term)) {
                        if (!Array.isArray(term))
                            this.query.push(new queryElement_1.QueryElement(this.state === queryState_1.QueryState.PROPERTY_VALUE ? this.queryProp.toLowerCase() : this.queryProp, this.state, term, this.type, this.getPreviousPosition(), this.previousTerms));
                        else
                            term.forEach(function (t) { _this.query.push(new queryElement_1.QueryElement(t, _this.state, t, _this.type, _this.getPreviousPosition(), _this.previousTerms)); });
                    }
                }
                return this.state;
            };
            Orchestrator.prototype.removeTerm = function () {
                if (this.state != queryState_1.QueryState.INITIAL || this.isOrderBy) {
                    this.validDeleteOrderBy();
                    this.query.pop();
                    this.valid = 0;
                    switch (this.state = this.query.length === 0 ? queryState_1.QueryState.INITIAL : this.query[this.query.length - 1].type) {
                        case queryState_1.QueryState.PROPERTY_TERM:
                            this.nextTerms = this.isOrderBy ? this.getDirectionalOrderBy() : this.operatorMap[this.type];
                            break;
                        case queryState_1.QueryState.OPERATOR_TERM:
                            this.nextTerms = [];
                            break;
                        case queryState_1.QueryState.PROPERTY_VALUE:
                            this.valid = this.query[(this.query.length - 1) - 1].type === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES ? 0 : 1;
                            this.nextTerms = this.query[(this.query.length - 1) - 1].type === queryState_1.QueryState.PROPERTY_VALUE || this.query[(this.query.length - 1) - 1].type === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES ? [] : this.concatOps;
                            break;
                        case queryState_1.QueryState.CONCAT_TERM:
                            this.nextTerms = this.propertyTerms;
                            break;
                        case queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES:
                            this.nextTerms = [];
                            break;
                        default:
                            this.hasAdvancedState = false;
                            this.nextTerms = this.propertyTerms;
                            break;
                    }
                }
                return this.state;
            };
            Orchestrator.prototype.removeFromIndex = function (position) {
                return this.getEndPositionFromRemoveIndex(this.getTermIndexByPosition(position));
            };
            Orchestrator.prototype.getCurrentState = function () {
                return this.state;
            };
            Orchestrator.prototype.getPreviousState = function () {
                return typeof this.query[(this.query.length - 1) - 1] !== 'undefined' ?
                    this.query[(this.query.length - 1) - 1].type : queryState_1.QueryState.INITIAL;
            };
            Orchestrator.prototype.isValidQuery = function () {
                return Boolean(this.valid);
            };
            Orchestrator.prototype.isAdvancedState = function () {
                return this.hasAdvancedState;
            };
            Orchestrator.prototype.removeAllTerms = function () {
                var len = this.query.length;
                for (var idx = 0; idx < len; idx++) {
                    this.removeTerm();
                }
                return this.query.length === 0;
            };
            Orchestrator.prototype.setNextState = function (term) {
                switch (this.state) {
                    case queryState_1.QueryState.PROPERTY_TERM:
                        this.hasAdvancedState = ((this.state = this.isSetOperator(term) ? queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES : queryState_1.QueryState.OPERATOR_TERM) === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES) || this.getCurrentType() === 'RANGE';
                        if (this.isOrderBy) {
                            this.state = queryState_1.QueryState.INITIAL;
                            this.valid = 1;
                        }
                        this.nextTerms = this.setNextTermsFromOperator();
                        break;
                    case queryState_1.QueryState.OPERATOR_TERM:
                        this.state = queryState_1.QueryState.PROPERTY_VALUE;
                        this.valid = 1;
                        this.nextTerms = this.concatOps;
                        break;
                    case queryState_1.QueryState.PROPERTY_VALUE:
                        this.valid = this.hasAdvancedState && (!this.isConcatOperator || typeof term === 'undefined') ? 1 : 0;
                        this.state = this.valid ? queryState_1.QueryState.PROPERTY_VALUE : queryState_1.QueryState.CONCAT_TERM;
                        this.nextTerms = this.state === queryState_1.QueryState.PROPERTY_VALUE ? this.concatOps : this.propertyTerms;
                        this.setOrderBy(term);
                        break;
                    case queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES:
                        this.state = queryState_1.QueryState.PROPERTY_VALUE;
                        this.valid = 1;
                        this.nextTerms = this.concatOps;
                        break;
                    default:
                        this.state = queryState_1.QueryState.PROPERTY_TERM;
                        this.nextTerms = this.setNextTermsFromProperty(term);
                        break;
                }
                return true;
            };
            Orchestrator.prototype.validValues = function (terms) {
                var _this = this;
                if (!Array.isArray(terms))
                    terms = [terms];
                return terms.every(function (t) {
                    return _this.validateValue(t);
                });
            };
            Orchestrator.prototype.validPropertyValue = function (position, value) {
                var query = this.query[this.getTermIndexByPosition(position)];
                if (typeof query === 'undefined' || !(query.type === queryState_1.QueryState.OPERATOR_TERM || query.type === queryState_1.QueryState.PROPERTY_VALUE || query.type === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES) || value.trim() === '')
                    return false;
                return Boolean(this.validateValue(value, query.propType));
            };
            Orchestrator.prototype.getNextTerms = function (position) {
                if (this.query.length === 0 || this.query[this.query.length - 1].position.end + 1 === position || position === -1)
                    return this.nextTerms;
                return this.getNextTermsByRangePosition(position);
            };
            Orchestrator.prototype.getPropertyMapObject = function (term) {
                var _this = this;
                return this.propertyMap[this.queryProp = Object.keys(this.propertyMap).filter(function (p) { return _this.propertyMap[p].name.toLowerCase() === term.toLowerCase(); })[0]];
            };
            Orchestrator.prototype.getQueryProp = function () {
                return this.queryProp;
            };
            Orchestrator.prototype.getQuery = function () {
                return this.query;
            };
            Orchestrator.prototype.getCurrentType = function () {
                return this.type;
            };
            Orchestrator.prototype.getIsOrderBy = function () {
                return this.isOrderBy;
            };
            Orchestrator.prototype.getFullOperators = function () {
                return (["=", "IS", "!=", "!IS", "IS NOT", "<>", ">", ">=", "<", "<=",
                    "STARTS WITH", "ENDS WITH", "!IN", "!CONTAINS",
                    "NOT IN", "!==", "BETWEEN", "IN", "CONTAINS", "=="])
                    .concat(this.getConcatOperatorsConfig())
                    .concat(this.getDirectionalOrderBy());
            };
            Orchestrator.prototype.getDirectionalOrderBy = function () {
                return (["ASC", "DESC"]);
            };
            Orchestrator.prototype.setPropertyTerms = function () {
                for (var p in this.propertyMap)
                    this.propertyTerms.push(this.propertyMap[p].name);
                this.propertyTerms = this.propertyTerms.sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
            };
            Orchestrator.prototype.setOrderBy = function (term) {
                if (this.state === queryState_1.QueryState.CONCAT_TERM && term === this.ORDER_BY)
                    this.isOrderBy = true;
            };
            Orchestrator.prototype.setNextTermsFromProperty = function (term) {
                this.type = this.getPropertyMapObject(term).type;
                if (this.isOrderBy)
                    return this.getDirectionalOrderBy();
                return this.operatorMap[this.type];
            };
            Orchestrator.prototype.getEndPositionFromRemoveIndex = function (idx) {
                return this.handleRemoveWithIndex(idx, idx === -1 ? 0 : this.query[idx].position.end);
            };
            Orchestrator.prototype.handleRemoveWithIndex = function (idx, endPosition) {
                if (this.query.length === 0 || idx === -1)
                    return 0;
                while (idx < this.query.length)
                    this.removeTerm();
                return endPosition;
            };
            Orchestrator.prototype.setNextTermsFromOperator = function () {
                if (this.isOrderBy) {
                    return this.getFilterPropertyTerms(this.getOrderedProps(this.getTermOrderBy()));
                }
                return [];
            };
            Orchestrator.prototype.getFilterPropertyTerms = function (orderedProps) {
                return this.propertyTerms.filter(function (x) {
                    return orderedProps.indexOf(x) === -1;
                });
            };
            Orchestrator.prototype.getOrderedProps = function (termOrderBy) {
                return this.query.filter(function (x) {
                    return (x.position.start > termOrderBy.position.end) && x.type === 1;
                }).map(function (e) { return e.text; });
            };
            Orchestrator.prototype.getTermOrderBy = function () {
                var _this = this;
                return this.query.find(function (x) {
                    return x.text === _this.ORDER_BY;
                });
            };
            Orchestrator.prototype.validDeleteOrderBy = function () {
                var currentQry = this.query[this.query.length - 1];
                if (currentQry.type === queryState_1.QueryState.CONCAT_TERM && currentQry.text === this.ORDER_BY)
                    this.isOrderBy = false;
            };
            Orchestrator.prototype.ensureMappingObjects = function (concatOps) {
                this.mapConcapOperator(concatOps);
                this.mapOperators();
                this.mapProperties();
            };
            Orchestrator.prototype.mapConcapOperator = function (concatOps) {
                for (var c in concatOps) {
                    this.concatOps.push(concatOps[c]);
                }
            };
            Orchestrator.prototype.mapOperators = function () {
                for (var c in this.operatorMap) {
                    var operations = [];
                    for (var o in this.operatorMap[c]) {
                        operations.push(this.operatorMap[c][o]);
                    }
                    this.operatorMap[c] = operations;
                }
            };
            Orchestrator.prototype.mapProperties = function () {
                for (var x in this.propertyMap) {
                    var valid = false;
                    for (var p in this.operatorMap) {
                        if (p === this.propertyMap[x].type) {
                            valid = true;
                        }
                    }
                    if (!valid)
                        throw "Invalid Operation Definition -- " + this.propertyMap[x] + " not defined.";
                }
            };
            Orchestrator.prototype.validateTerm = function (term) {
                if (Array.isArray(term))
                    return false;
                return this.nextTerms.map(function (x) { return x.toLowerCase(); }).indexOf(term.toLowerCase()) != -1;
            };
            Orchestrator.prototype.validateValuesNoConcatOperators = function (terms) {
                if (!(this.isConcatOperator = typeof terms === JavascriptTypes.STRING && this.concatOps.indexOf(terms) > -1)) {
                    return this.validValues(terms);
                }
                return this.isConcatOperator;
            };
            Orchestrator.prototype.validateValue = function (term, propType) {
                if (propType === void 0) { propType = this.type; }
                var cleanTerm = term.replace(/((')|(\[)|(\()|(\])|(\)))/g, '');
                switch (propType) {
                    case Types.REAL:
                        return parseFloat(cleanTerm).toString() === cleanTerm;
                    case Types.INTEGER:
                        return parseInt(cleanTerm).toString() === cleanTerm;
                    case Types.DATE:
                    case Types.DATE_RANGE:
                        return this.isValidDate(cleanTerm);
                    case Types.DATETIME:
                        return this.isValidDate(cleanTerm) || this.isValidDateTime(cleanTerm);
                    case Types.STRING:
                        return true;
                    case Types.BOOLEAN:
                        return cleanTerm.toLowerCase() === "true" || cleanTerm.toLowerCase() === "false";
                }
                throw "Type not supported";
            };
            Orchestrator.prototype.isValidDate = function (date) {
                return moment(date, this.dateFormat, true).isValid();
            };
            Orchestrator.prototype.isValidDateTime = function (dateTime) {
                return moment(dateTime, this.dateTimeFormat, true).isValid() || moment(dateTime, this.dateTimeMillisecondsFormat, true).isValid() || moment(dateTime, this.dateTimeHourMinFormat, true).isValid();
            };
            Orchestrator.prototype.isSetOperator = function (term) {
                return !!(this.ADVANCED_OPS.concat(this.SPECIFIED_OPS).indexOf(term) > -1);
            };
            Orchestrator.prototype.getOperatorsConfig = function () {
                var PRIMITIVES_OPS = ["=", "IS", "!=", "!IS", "IS NOT", "<>"];
                var NUMBERS_VALID_OPS = Array.prototype.concat(PRIMITIVES_OPS, this.ADVANCED_OPS.concat([">", ">=", "<", "<="]).concat(this.SPECIFIED_OPS));
                var STRING_VALID_OPS = Array.prototype.concat(PRIMITIVES_OPS, this.ADVANCED_OPS.concat(["STARTS WITH", "ENDS WITH", "CONTAINS", "!CONTAINS"]).concat(this.SPECIFIED_OPS));
                var DATES_VALID_OPS = Array.prototype.concat(PRIMITIVES_OPS, this.ADVANCED_OPS).concat(this.SPECIFIED_OPS);
                var DATES_RANGE_VALID_OPS = DATES_VALID_OPS.concat([">", ">=", "<", "<="]);
                var BOOLEAN_VALID_OPS = ["=", "IS"];
                var RANGE_VALID_OPS = ["=", "IS", ">", ">=", "<", "<="];
                return ({
                    REAL: NUMBERS_VALID_OPS,
                    INTEGER: NUMBERS_VALID_OPS,
                    STRING: STRING_VALID_OPS,
                    DATE: DATES_VALID_OPS,
                    DATETIME: DATES_VALID_OPS,
                    BOOLEAN: BOOLEAN_VALID_OPS,
                    RANGE: RANGE_VALID_OPS,
                    DATE_RANGE: DATES_RANGE_VALID_OPS
                });
            };
            Orchestrator.prototype.getConcatOperatorsConfig = function () {
                return (["AND", "*", "OR", "+", "ORDER BY"]);
            };
            Orchestrator.prototype.getPreviousPosition = function () {
                return this.query.length === 0 ? -1 : this.query[this.query.length - 1].position.end;
            };
            Orchestrator.prototype.getTermIndexByPosition = function (position) {
                return this.getDataByPosition('findIndex', position);
            };
            Orchestrator.prototype.getNextTermsByRangePosition = function (position) {
                return this.handleNextTerms(this.getDataByPosition('find', position), position);
            };
            Orchestrator.prototype.handleNextTerms = function (element, position) {
                if (!element)
                    return this.nextTerms;
                return this.handleNextTermsWithFilter(this.getTermsFiltered(element.nextTerms, element.text.substring(0, (position - element.position.start)).toLowerCase()));
            };
            Orchestrator.prototype.handleNextTermsWithFilter = function (termsFiltered) {
                return termsFiltered.length > 1 ? termsFiltered : [];
            };
            Orchestrator.prototype.getTermsFiltered = function (nextTerms, item) {
                return nextTerms.filter(function (x) {
                    return x.toLowerCase().indexOf(item) > -1;
                });
            };
            Orchestrator.prototype.getDataByPosition = function (method, position) {
                return this.query[method](function (x) {
                    return x.position.start <= position && x.position.end >= position;
                });
            };
            return Orchestrator;
        }());
        core.Orchestrator = Orchestrator;
    })(core = query_1.core || (query_1.core = {}));
})(query = exports.query || (exports.query = {}));

//# sourceMappingURL=orchestratorObject.js.map

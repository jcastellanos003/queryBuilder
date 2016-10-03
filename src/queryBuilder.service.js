"use strict";
var queryState_1 = require('./core/queryState');
var queryItem_1 = require('./queryItem');
var queryReplaceElement_1 = require('./queryReplaceElement');
var business;
(function (business) {
    "use strict";
    var QueryBuilderService = (function () {
        function QueryBuilderService($window, informationStorageHelper) {
            this.$window = $window;
            this.informationStorageHelper = informationStorageHelper;
        }
        QueryBuilderService.prototype.filterText = function (orchestrator, value) {
            return value.substring(this.getTermsJoined(orchestrator).length, value.length).trim();
        };
        QueryBuilderService.prototype.bindAllModel = function (orchestrator, value, replaceValue, position) {
            if (!orchestrator.getQuery().length)
                return ({
                    value: replaceValue,
                    position: replaceValue.length
                });
            if (position < this.getTermsJoined(orchestrator).length) {
                return this.getTermsJoinedWithReplace(orchestrator, value, replaceValue, position);
            }
            return ({
                value: this.getTermsJoined(orchestrator) + ' ' + replaceValue,
                position: position + replaceValue.length
            });
        };
        QueryBuilderService.prototype.resetReplaceEvent = function (isReplace, replaceTerm) {
            if (isReplace === void 0) { isReplace = false; }
            if (replaceTerm === void 0) { replaceTerm = new queryReplaceElement_1.QueryReplaceElement(); }
            this.replaceEvent = isReplace;
            this.replaceTerm = replaceTerm;
        };
        QueryBuilderService.prototype.resetTypedQuery = function (value) {
            this.typedQuery = value;
        };
        QueryBuilderService.prototype.updateQueryState = function (type, isValid) {
            this.currentValidState = type === 0 ? new queryItem_1.QueryItem()
                : isValid ? new queryItem_1.QueryItem('fa-check-circle', '#22B557', true)
                    : new queryItem_1.QueryItem('fa-times-circle', '#B22F36', false);
            return this.currentValidState;
        };
        QueryBuilderService.prototype.resetTermsWhenDeletePerformed = function (info, orchestrator) {
            if (info.field.selectionStart === 0)
                return;
            this.validResetTermsFromDelete(info, orchestrator, orchestrator.getQuery().length, this.getStartPositionFromElement(orchestrator.getQuery(), (info.field.selectionStart - 1)), this.getResultFragment(info, orchestrator.removeFromIndex(info.field.selectionStart)));
        };
        QueryBuilderService.prototype.detectQueryChanges = function (info, orchestrator) {
            if (info.value === '' && orchestrator.getCurrentState() === 0 && orchestrator.getIsOrderBy())
                return;
            if ((((info.field.selectionStart < info.field.value.length)
                && (info.field.value.substring(info.field.selectionStart, info.field.value.length).trim() !== "'")
                && (info.field.value !== this.typedQuery))
                || (info.field.selectionStart === info.field.value.length && orchestrator.isValidQuery() && this.getTermsJoined(orchestrator) !== info.field.value))
                && (!this.replaceEvent || (this.replaceEvent && this.validStatePropertyValue(orchestrator.getCurrentState())))) {
                this.updateTerm(info.field.value, info.field.selectionStart, orchestrator);
            }
        };
        QueryBuilderService.prototype.addNextTerm = function (value, position, orchestrator, deleteState) {
            if (this.pasteEvent || deleteState) {
                return this.reviewQuerySyntax(value, position, orchestrator);
            }
            if (this.replaceEvent && value !== '') {
                return this.updateTerm((this.getTermsJoined(orchestrator) + ' ' + value + this.replaceTerm.value).trim(), this.replaceTerm.position, orchestrator);
            }
            if (value === '' && (orchestrator.isValidQuery() || this.replaceEvent))
                return true;
            return this.setNewTerm(value, orchestrator);
        };
        QueryBuilderService.prototype.validStatus = function (info, orchestrator) {
            return (((info.keyCode === KeyCodes.KEY_RETURN || info.keyCode === KeyCodes.KEY_TAB || (info.keyCode === KeyCodes.KEY_SPACE && (info.field.selectionStart === info.field.value.length)))
                && (this.getLowerNextTerms(orchestrator.getNextTerms(-1)).indexOf(info.value.toLowerCase()) != -1
                    || (orchestrator.getCurrentState() === queryState_1.QueryState.OPERATOR_TERM || orchestrator.getCurrentState() === queryState_1.QueryState.PROPERTY_VALUE || orchestrator.getCurrentState() === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES))
                && (info.value.trim() !== '' || orchestrator.isAdvancedState()))
                || (this.replaceEvent && (info.keyCode === KeyCodes.KEY_RETURN || info.keyCode === KeyCodes.KEY_SPACE))
                || (info.keyCode === KeyCodes.KEY_RETURN && orchestrator.isValidQuery()));
        };
        QueryBuilderService.prototype.handleOpenWindow = function (openWindow, onWindowActive) {
            if (openWindow) {
                var objWindow = onWindowActive()();
                if (objWindow)
                    this.$window.open(objWindow.url, objWindow.name, objWindow.size);
            }
        };
        QueryBuilderService.prototype.validStatusQuery = function (info, orchestrator, position) {
            return this.validChangesQuery(info.field.value, this.getTermsJoined(orchestrator), orchestrator.getCurrentState(), orchestrator)
                || (this.validPropertyValue(orchestrator, (position - (1 + info.value.length)), info.value) && this.validStateToSearch(orchestrator.getCurrentState()));
        };
        QueryBuilderService.prototype.validDeleteStatusQuery = function (info, currentState, query) {
            if ((currentState === queryState_1.QueryState.OPERATOR_TERM || currentState === queryState_1.QueryState.PROPERTY_VALUE || currentState === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES)
                && (query.length < info.field.value.length))
                return false;
            return true;
        };
        QueryBuilderService.prototype.validResetIconState = function (queryLen, value) {
            return queryLen === 0 && value === '';
        };
        QueryBuilderService.prototype.validQueryMultipleValuesDelete = function (currentState, previousState) {
            return currentState === queryState_1.QueryState.PROPERTY_VALUE && (previousState === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES || previousState === queryState_1.QueryState.PROPERTY_VALUE);
        };
        QueryBuilderService.prototype.validShouldSearch = function (shouldSearch, isOrderBy, state) {
            return this.validRegularSearch(shouldSearch, isOrderBy, state)
                || this.validSpecializedSearch(shouldSearch, state);
        };
        QueryBuilderService.prototype.getTermsJoined = function (orchestrator) {
            return orchestrator.getQuery().map(function (x) { return x.text; }).join(' ');
        };
        QueryBuilderService.prototype.getSimpleQuotesFromRange = function (orchestrator, info) {
            return orchestrator.isAdvancedState() && orchestrator.getCurrentState() === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES
                && (info.field.value.substring(info.field.value.length - 1, info.field.value.length) === " ")
                && orchestrator.getQuery().find(function (x) { return x.position.end + 1 === info.field.selectionStart; });
        };
        QueryBuilderService.prototype.getNextTerms = function (position, value, orchestrator) {
            var _this = this;
            if (!this.replaceEvent)
                return orchestrator.getNextTerms(position);
            var wordToFilter = (this.replaceTerm.value != '' ? value.split(this.replaceTerm.value.trim())[0] : value).substring(this.replaceTerm.startPosition, (position - 1)).trim();
            if (orchestrator.getQuery()
                .find(function (x) {
                return x.text.toUpperCase() === wordToFilter.toUpperCase() && x.position.start === _this.replaceTerm.startPosition && x.position.end === (position - 1);
            })) {
                return orchestrator.getNextTerms(position);
            }
            return orchestrator.getNextTerms(position).filter(function (x) {
                return x.startsWith(wordToFilter);
            });
        };
        QueryBuilderService.prototype.handleCopiedText = function (field, orchestrator) {
            this.pasteEvent = true;
            this.setCopiedText(field, this.filterText(orchestrator, field.value), orchestrator);
        };
        QueryBuilderService.prototype.setCopiedText = function (field, data, orchestrator) {
            this.validCopiedText(this.getCustomPastedInput(field, data), orchestrator);
            this.pasteEvent = false;
        };
        QueryBuilderService.prototype.validCopiedText = function (info, orchestrator) {
            this.detectQueryChanges(info, orchestrator);
            if (this.filterText(orchestrator, info.field.value) === '')
                return;
            this.addNextTerm(info.value, info.field.selectionStart, orchestrator, false);
        };
        QueryBuilderService.prototype.getCustomPastedInput = function (field, data) {
            return { value: data, field: { value: field.value, selectionStart: (field.selectionStart + data.length) } };
        };
        QueryBuilderService.prototype.validRegularSearch = function (shouldSearch, isOrderBy, state) {
            return shouldSearch && this.validSearch(isOrderBy, state) && !this.replaceEvent;
        };
        QueryBuilderService.prototype.validSpecializedSearch = function (shouldSearch, state) {
            return this.replaceEvent && this.validStateToSearch(state) && shouldSearch;
        };
        QueryBuilderService.prototype.getTermsJoinedWithReplace = function (orchestrator, value, replaceValue, position) {
            return this.getReplaceTermValue(value, replaceValue, this.getStartPositionFromElement(orchestrator.getQuery(), position), orchestrator.removeFromIndex(position));
        };
        QueryBuilderService.prototype.getStartPositionFromElement = function (elements, position) {
            var filterResult = elements.find(function (x) {
                return x.position.start <= position && x.position.end >= position;
            });
            return filterResult ? filterResult.position.start : position;
        };
        QueryBuilderService.prototype.getReplaceTermValue = function (value, replaceValue, position, endPosition) {
            this.resetReplaceEvent(true, new queryReplaceElement_1.QueryReplaceElement('', endPosition));
            return ({
                value: value.substring(0, position) + replaceValue + value.substring(endPosition, value.length),
                position: position + replaceValue.length
            });
        };
        QueryBuilderService.prototype.getLowerNextTerms = function (nextTerms) {
            return nextTerms.map(function (x) { return x.toLowerCase(); });
        };
        QueryBuilderService.prototype.updateTerm = function (value, position, orchestrator) {
            orchestrator.removeAllTerms();
            return this.getResultUpdateTerm(this.reviewQuerySyntax(value, position, orchestrator));
        };
        QueryBuilderService.prototype.getResultUpdateTerm = function (resultUpdate) {
            this.resetReplaceEvent();
            return resultUpdate;
        };
        QueryBuilderService.prototype.validResetTermsFromDelete = function (info, orchestrator, len, startPosition, fragment) {
            if (len === orchestrator.getQuery().length)
                return;
            this.resetReplaceEvent(true, new queryReplaceElement_1.QueryReplaceElement(fragment, info.field.selectionStart, startPosition));
            this.validAddNextReplaceValue(this.getValueToReplace(info.field.value, fragment), fragment, info.field.selectionStart, orchestrator);
        };
        QueryBuilderService.prototype.reviewQuerySyntax = function (value, position, orchestrator) {
            var status = true, result = null;
            while (status && value !== '') {
                position = this.validLastPosition(this.getLastPosition(orchestrator.getQuery()));
                result = this.setPasteQuery(value, position, status, orchestrator) || { status: false, value: '' };
                status = result.status;
                value = result.value;
            }
            return status;
        };
        QueryBuilderService.prototype.getLastPosition = function (terms) {
            return terms[terms.length - 1];
        };
        QueryBuilderService.prototype.validSearch = function (isOrderBy, state) {
            return state === queryState_1.QueryState.PROPERTY_VALUE || (state === queryState_1.QueryState.INITIAL && isOrderBy) || this.validStateToSearch(state);
        };
        QueryBuilderService.prototype.getResultFragment = function (info, endPosition) {
            if (info.field.selectionStart === info.field.selectionEnd)
                return info.field.value.substring(endPosition, info.field.value.length);
            return info.field.value.substring(info.field.selectionStart, info.field.selectionEnd);
        };
        QueryBuilderService.prototype.validLastPosition = function (lastTerm) {
            return typeof lastTerm === 'undefined' ? 0 : lastTerm.position.end + 1;
        };
        QueryBuilderService.prototype.setPasteQuery = function (value, position, status, orchestrator) {
            var result = this.setOperatorValue(value, position, status, orchestrator);
            if (result === null) {
                result = this.setPropertyValue(value, position, status, orchestrator);
            }
            return result;
        };
        QueryBuilderService.prototype.setOperatorValue = function (value, position, status, orchestrator) {
            var currentValue = orchestrator.getNextTerms(position).filter(function (x) {
                return value.substring(0, x.length).toUpperCase() === x.toUpperCase() && value.substring(x.length, (x.length + 1)) === ' ';
            });
            if (currentValue[currentValue.length - 1]) {
                return this.setNextValuePaste(currentValue[currentValue.length - 1], value, status, orchestrator);
            }
            return null;
        };
        QueryBuilderService.prototype.setPropertyValue = function (value, position, status, orchestrator) {
            if (orchestrator.getNextTerms(position).length > 0)
                return null;
            if (value.substring(0, 1).toString() === '\'') {
                return this.matchValueWithSpaces(value, status, orchestrator);
            }
            return this.setNextValuePaste(value.split(' ')[0], value, status, orchestrator);
        };
        QueryBuilderService.prototype.matchValueWithSpaces = function (value, status, orchestrator) {
            if (this.getMatchValue(value)) {
                return this.setNextValuePaste(this.getMatchValue(value)[0], value, status, orchestrator);
            }
        };
        QueryBuilderService.prototype.getMatchValue = function (value) {
            return value.match(/'(.*?)'/);
        };
        QueryBuilderService.prototype.setNextValuePaste = function (current, value, status, orchestrator) {
            return {
                value: value.substring(current.length, value.length).trim(),
                status: this.setNewTerm(current, orchestrator) };
        };
        QueryBuilderService.prototype.validNextQueryState = function (value, orchestrator) {
            var query = orchestrator.getQuery()[orchestrator.getQuery().length - 1];
            if (this.validValuePropNotRange(query, orchestrator, value))
                return true;
            value = value.replace(/\'/g, '');
            return (this.validCommonValue(orchestrator, value) || this.validRangeValues(orchestrator, value));
        };
        QueryBuilderService.prototype.getObservableLastRange = function (elements) {
            return Rx.Observable.from(elements.map(function (x) { return x.type; }));
        };
        QueryBuilderService.prototype.getLastRangeIndex = function (source, lastIndex, inValues) {
            source
                .lastIndexOf(queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES)
                .subscribe(function (x) {
                source
                    .filter(function (val, idx) {
                    return idx > (lastIndex = x);
                })
                    .flatMap(function (val, idx) { return Rx.Observable.just(val); })
                    .subscribe(function (o) {
                    inValues.push(o);
                });
            });
            return ({
                index: lastIndex,
                inValues: inValues
            });
        };
        QueryBuilderService.prototype.validCommonOperator = function (query) {
            return query[query.length - 1].type === queryState_1.QueryState.OPERATOR_TERM || query[(query.length - 1 - 1)].type === queryState_1.QueryState.OPERATOR_TERM;
        };
        QueryBuilderService.prototype.validCommonValue = function (orchestrator, value) {
            return this.validCommonOperator(orchestrator.getQuery()) &&
                (this.validValueIsNotOperator(orchestrator.getFullOperators(), value) || value.trim() !== '');
        };
        QueryBuilderService.prototype.validValueIsNotOperator = function (operators, value) {
            return operators.map(function (x) { return x.toLowerCase(); }).indexOf(value.toLowerCase()) === -1;
        };
        QueryBuilderService.prototype.validValuePropNotRange = function (term, orchestrator, value) {
            return orchestrator.getQuery().length === 0
                || (orchestrator.isValidQuery() && value === '')
                || (orchestrator.isValidQuery() && ["AND", "*", "OR", "+", "ORDER BY"].indexOf(value.toUpperCase()) !== -1)
                || !(this.validStatePropertyValue(term.type));
        };
        QueryBuilderService.prototype.validRangeValues = function (orchestrator, value) {
            var result = this.getLastRangeIndex(this.getObservableLastRange(orchestrator.getQuery()), 0, value.trim() != '' ? value.split(' ') : []);
            return orchestrator.getQuery()[result.index].text.toUpperCase() === 'BETWEEN' ? result.inValues.length === 2 : result.inValues.length > 1;
        };
        QueryBuilderService.prototype.validNonAbleCharsToAdd = function (char) {
            return ["", "'"].indexOf(char) > -1;
        };
        QueryBuilderService.prototype.validChangesQuery = function (value, currentValue, currentState, orchestrator) {
            return (value.trim() === currentValue.trim()
                && (currentState === queryState_1.QueryState.INITIAL || currentState === queryState_1.QueryState.PROPERTY_VALUE) && !(orchestrator.isAdvancedState()))
                || this.validChangesQueryWhenOrderBy(value.substring(currentValue.length, value.length).trim(), orchestrator.getIsOrderBy(), orchestrator.getDirectionalOrderBy());
        };
        QueryBuilderService.prototype.validChangesQueryWhenOrderBy = function (value, isOrderBy, directionals) {
            return isOrderBy && directionals.indexOf(value.toUpperCase()) !== -1;
        };
        QueryBuilderService.prototype.validPropertyValue = function (orchestrator, position, value) {
            if ((!this.isChangedValue(value) && value.trim() !== "" && this.currentValidState.state))
                return true;
            return this.getValidationPropertyValue(orchestrator, value, position);
        };
        QueryBuilderService.prototype.getValidationPropertyValue = function (orchestrator, value, position) {
            if (!(orchestrator.getCurrentState() === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES || orchestrator.getCurrentState() === queryState_1.QueryState.PROPERTY_VALUE))
                return this.validPropertyCommonValue(orchestrator, value, position);
            return this.validMultiplePropertyValues(orchestrator, position, value);
        };
        QueryBuilderService.prototype.validMultiplePropertyValues = function (orchestrator, position, value) {
            return this.handleMultipleValues(orchestrator, this.getMatchValue(value), position);
        };
        QueryBuilderService.prototype.handleMultipleValues = function (orchestrator, matchValue, position) {
            if (!matchValue)
                return false;
            return this.validEachPropertyValue(orchestrator, matchValue[1].split(' '), position)
                && this.validRangeValues(orchestrator, matchValue[1]);
        };
        QueryBuilderService.prototype.validEachPropertyValue = function (orchestrator, propValues, position) {
            var result = false;
            for (var idx in propValues) {
                result = this.validPropertyCommonValue(orchestrator, propValues[idx], position);
            }
            return result;
        };
        QueryBuilderService.prototype.validPropertyCommonValue = function (orchestrator, value, position) {
            return orchestrator.validPropertyValue(position, value) && this.validValueIsNotOperator(orchestrator.getFullOperators(), value);
        };
        QueryBuilderService.prototype.validStatePropertyValue = function (state) {
            return this.validStateToSearch(state) || state === queryState_1.QueryState.PROPERTY_VALUE;
        };
        QueryBuilderService.prototype.isChangedValue = function (value) {
            return this.handleChangedValue(this.changedValue !== value, value);
        };
        QueryBuilderService.prototype.handleChangedValue = function (isChanged, value) {
            this.changedValue = this.changedValue !== value ? value : this.changedValue;
            return isChanged;
        };
        QueryBuilderService.prototype.getValueToReplace = function (value, fragment) {
            return value.split(fragment)[1];
        };
        QueryBuilderService.prototype.validStateToSearch = function (state) {
            return state === queryState_1.QueryState.OPERATOR_TERM || state === queryState_1.QueryState.PROPERTY_MULTIPLE_VALUES;
        };
        QueryBuilderService.prototype.validAddNextReplaceValue = function (value, fragment, start, orchestrator) {
            if (fragment.trim() === '' || typeof value === 'undefined')
                return;
            this.addNextTerm(value, start, orchestrator, true);
        };
        QueryBuilderService.prototype.setNewTerm = function (value, orchestrator) {
            if (this.validNextQueryState(value, orchestrator)) {
                this.validNonAbleCharsToAdd(value.trim())
                    ? orchestrator.setNextState()
                    : orchestrator.addTerm((orchestrator.isAdvancedState() && value.indexOf(' ') > -1
                        && (this.validStateToSearch(orchestrator.getCurrentState())))
                        ? value.split(' ') : value) != 0;
                this.saveLastExecutedQuery(orchestrator.getQuery());
                return true;
            }
            return false;
        };
        QueryBuilderService.prototype.saveLastExecutedQuery = function (query) {
            this.informationStorageHelper.setQueryValue(query);
        };
        return QueryBuilderService;
    }());
    QueryBuilderFactory.$inject = ['$window', 'informationStorageHelper'];
    function QueryBuilderFactory($window, informationStorageHelper) {
        return new QueryBuilderService($window, informationStorageHelper);
    }
    angular
        .module(CPALS.modules.directives.MAIN)
        .factory('QueryBuilderService', QueryBuilderFactory);
})(business || (business = {}));

//# sourceMappingURL=queryBuilder.service.js.map

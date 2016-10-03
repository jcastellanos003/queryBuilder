/// <reference path="../../../../../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../../../../../typings/rx/rx.d.ts" />
/// <reference path="../../../../../../../typings/rx/rx.async.d.ts" />

import { IQueryBuilderService } from './models/component';

import { IOrchestrator } from './core/orchestrator';
import { QueryElement } from './core/queryElement';
import { QueryState } from './core/queryState';

import { IQueryMapKeyboard } from './models/helpers';

import { QueryItem } from './queryItem';
import { QueryReplaceElement } from './queryReplaceElement';

module business {
    "use strict";
    declare var CPALS: any;
    declare var Rx: any;
    declare var KeyCodes: any;

    class QueryBuilderService implements IQueryBuilderService {
      public pasteEvent: boolean;
      public replaceEvent: boolean;
      public replaceTerm: QueryReplaceElement;
      public queryChanged: boolean;
      public changedValue: string;
      public typedQuery: string;
      public currentValidState: QueryItem; 
      constructor(public $window: any, public informationStorageHelper: any) {
      }

      filterText(orchestrator: IOrchestrator, value: string): string {
        return value.substring(this.getTermsJoined(orchestrator).length, value.length).trim();
      }

      bindAllModel(orchestrator: IOrchestrator, value: string, replaceValue: string, position: number): any {
        if(!orchestrator.getQuery().length) return ({
          value: replaceValue,
          position: replaceValue.length
        });
        if(position < this.getTermsJoined(orchestrator).length) {
          return this.getTermsJoinedWithReplace(orchestrator, value, replaceValue, position);
        }
        return ({
          value: this.getTermsJoined(orchestrator) + ' ' + replaceValue,
          position: position + replaceValue.length
        });
      }

      resetReplaceEvent(isReplace: boolean = false, replaceTerm : QueryReplaceElement = new QueryReplaceElement()): void {
        this.replaceEvent = isReplace;
        this.replaceTerm = replaceTerm;
      }

      resetTypedQuery(value: string): void {
        this.typedQuery = value;
      }

      updateQueryState(type: number, isValid: boolean): Object {
        this.currentValidState = type === 0 ? new QueryItem()
        : isValid ? new QueryItem('fa-check-circle', '#22B557', true)
        : new QueryItem('fa-times-circle', '#B22F36', false);
        return this.currentValidState;
      }

      resetTermsWhenDeletePerformed(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void {
        if(info.field.selectionStart === 0) return;
        this.validResetTermsFromDelete(info, orchestrator, orchestrator.getQuery().length, this.getStartPositionFromElement(orchestrator.getQuery(), (info.field.selectionStart - 1)), 
          this.getResultFragment(info, orchestrator.removeFromIndex(info.field.selectionStart)))
      }

      detectQueryChanges(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void {
        if(info.value === '' && orchestrator.getCurrentState() === 0 && orchestrator.getIsOrderBy()) return;
        if((((info.field.selectionStart < info.field.value.length)
          && (info.field.value.substring(info.field.selectionStart, info.field.value.length).trim() !== "'") 
          && (info.field.value !== this.typedQuery)) 
          || (info.field.selectionStart === info.field.value.length && orchestrator.isValidQuery() && this.getTermsJoined(orchestrator) !== info.field.value))
          && (!this.replaceEvent || (this.replaceEvent && this.validStatePropertyValue(orchestrator.getCurrentState())))) {
          this.updateTerm(info.field.value, info.field.selectionStart, orchestrator);
        }
      }
      
      addNextTerm(value: string, position: number, orchestrator: IOrchestrator, deleteState: boolean): boolean {
        if(this.pasteEvent || deleteState) {
          return this.reviewQuerySyntax(value, position, orchestrator);
        }
        if(this.replaceEvent && value !== '') {
          return this.updateTerm((this.getTermsJoined(orchestrator) + ' ' + value + this.replaceTerm.value).trim(), this.replaceTerm.position, orchestrator);
        }
        if(value === '' && (orchestrator.isValidQuery() || this.replaceEvent)) return true;
        return this.setNewTerm(value, orchestrator);
      }

      validStatus(info: IQueryMapKeyboard, orchestrator: IOrchestrator): boolean {
        return (
          (
            (info.keyCode === KeyCodes.KEY_RETURN || info.keyCode === KeyCodes.KEY_TAB || (info.keyCode === KeyCodes.KEY_SPACE && (info.field.selectionStart === info.field.value.length)))
            && (
              this.getLowerNextTerms(orchestrator.getNextTerms(-1)).indexOf(info.value.toLowerCase()) != -1
              || (
                orchestrator.getCurrentState() === QueryState.OPERATOR_TERM || orchestrator.getCurrentState() === QueryState.PROPERTY_VALUE || orchestrator.getCurrentState() === QueryState.PROPERTY_MULTIPLE_VALUES
              )
            )
            && (info.value.trim() !== '' || orchestrator.isAdvancedState())
          )
          || (
            this.replaceEvent && (info.keyCode === KeyCodes.KEY_RETURN || info.keyCode === KeyCodes.KEY_SPACE)
          )
          || (
            info.keyCode === KeyCodes.KEY_RETURN && orchestrator.isValidQuery()
          )
        );
      }

      handleOpenWindow(openWindow: boolean, onWindowActive: any): void {
        if(openWindow) {
          let objWindow = onWindowActive()();
          if(objWindow) this.$window.open(objWindow.url, objWindow.name, objWindow.size);
        }
      }

      validStatusQuery(info: IQueryMapKeyboard, orchestrator: IOrchestrator, position: number): boolean {
        return this.validChangesQuery(info.field.value, this.getTermsJoined(orchestrator), orchestrator.getCurrentState(), orchestrator)
        || (this.validPropertyValue(orchestrator, (position - (1 + info.value.length)), info.value) && this.validStateToSearch(orchestrator.getCurrentState()));
      }

      validDeleteStatusQuery(info: IQueryMapKeyboard, currentState: number, query: string): boolean {
        if((currentState === QueryState.OPERATOR_TERM || currentState === QueryState.PROPERTY_VALUE || currentState === QueryState.PROPERTY_MULTIPLE_VALUES) 
        && (query.length < info.field.value.length)) return false;
        return true;
      }

      validResetIconState(queryLen: number, value: string): boolean {
        return queryLen === 0 && value === '';
      }

      validQueryMultipleValuesDelete(currentState: number, previousState: number): boolean {
        return currentState === QueryState.PROPERTY_VALUE && (previousState === QueryState.PROPERTY_MULTIPLE_VALUES || previousState === QueryState.PROPERTY_VALUE);
      }

      validShouldSearch(shouldSearch: boolean, isOrderBy: boolean, state: number): boolean {
        return this.validRegularSearch(shouldSearch, isOrderBy, state) 
          || this.validSpecializedSearch(shouldSearch, state);
      }

      getTermsJoined(orchestrator: IOrchestrator): string {
        return orchestrator.getQuery().map((x: QueryElement) => { return x.text }).join(' ');
      }

      getSimpleQuotesFromRange(orchestrator: IOrchestrator, info: IQueryMapKeyboard): boolean {
        return orchestrator.isAdvancedState() && orchestrator.getCurrentState() === QueryState.PROPERTY_MULTIPLE_VALUES 
          && (info.field.value.substring(info.field.value.length - 1, info.field.value.length) === " ")
          && orchestrator.getQuery().find(function(x) { return x.position.end + 1 === info.field.selectionStart })
      }

      getNextTerms(position: number, value: string, orchestrator: IOrchestrator): Array<string> {
        if(!this.replaceEvent) return orchestrator.getNextTerms(position);
        let wordToFilter: string = (this.replaceTerm.value != '' ? value.split(this.replaceTerm.value.trim())[0] : value).substring(this.replaceTerm.startPosition, (position - 1)).trim();
        if(orchestrator.getQuery()
          .find((x: QueryElement): boolean => { 
            return x.text.toUpperCase() === wordToFilter.toUpperCase() && x.position.start === this.replaceTerm.startPosition && x.position.end === (position -1); })) {
              return orchestrator.getNextTerms(position);
          }
        return orchestrator.getNextTerms(position).filter((x: string): boolean => {
          return x.startsWith(wordToFilter);
        });
      }

      handleCopiedText(field: HTMLTextAreaElement, orchestrator: IOrchestrator): void {
        this.pasteEvent = true;
        this.setCopiedText(field, this.filterText(orchestrator, field.value), orchestrator);
      }

      private setCopiedText(field: HTMLTextAreaElement, data:string, orchestrator: IOrchestrator): void {
        this.validCopiedText(this.getCustomPastedInput(field, data), orchestrator);
        this.pasteEvent = false;
      }

      private validCopiedText(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void {
        this.detectQueryChanges(info, orchestrator);
        if (this.filterText(orchestrator, info.field.value) === '') return;
        this.addNextTerm(info.value, info.field.selectionStart, orchestrator, false);
      }

      private getCustomPastedInput(field: HTMLTextAreaElement, data: string): IQueryMapKeyboard {
        return <IQueryMapKeyboard>{ value: data, field: <HTMLTextAreaElement>{ value: field.value, selectionStart: (field.selectionStart + data.length) } }
      }

      private validRegularSearch(shouldSearch: boolean, isOrderBy: boolean, state: number): boolean {
        return shouldSearch && this.validSearch(isOrderBy, state) && !this.replaceEvent
      }

      private validSpecializedSearch(shouldSearch: boolean, state: number): boolean {
        return this.replaceEvent && this.validStateToSearch(state) && shouldSearch;
      }

      private getTermsJoinedWithReplace(orchestrator: IOrchestrator, value: string, replaceValue: string, position: number): Object {
        return this.getReplaceTermValue(value, replaceValue, this.getStartPositionFromElement(orchestrator.getQuery(), position), orchestrator.removeFromIndex(position));
      }

      private getStartPositionFromElement(elements: Array<QueryElement>, position: number): number {
        let filterResult = elements.find((x: QueryElement): boolean => {
          return x.position.start <= position && x.position.end >= position;
        });
        return filterResult ? filterResult.position.start : position;
      }

      private getReplaceTermValue(value: string, replaceValue: string, position: number, endPosition: number): Object {
        this.resetReplaceEvent(true, new QueryReplaceElement('', endPosition));
        return ({
          value: value.substring(0, position) + replaceValue + value.substring(endPosition, value.length),
          position: position + replaceValue.length
        });
      }

      private getReplacementWord(elements: Array<QueryElement>, value: string, position: number): string {
        return elements.length > 0 ? elements.map((x: QueryElement) => { 
          return x.position.start === position ? value : x.text 
        }).join(' ') : this.replaceTerm.value;
      }

      private getLowerNextTerms(nextTerms: Array<string>) {
        return nextTerms.map((x: string): any => { return x.toLowerCase() });
      }

      private updateTerm(value: string, position: number, orchestrator: IOrchestrator): boolean {
        orchestrator.removeAllTerms();
        return this.getResultUpdateTerm(this.reviewQuerySyntax(value, position, orchestrator));
      }

      private getResultUpdateTerm(resultUpdate: boolean): boolean {
        this.resetReplaceEvent();
        return resultUpdate;
      }

      private validResetTermsFromDelete(info: IQueryMapKeyboard, orchestrator: IOrchestrator, len: number, startPosition: number, fragment: string): void {
        if(len === orchestrator.getQuery().length) return;
        this.resetReplaceEvent(true, new QueryReplaceElement(fragment, info.field.selectionStart, startPosition));
        this.validAddNextReplaceValue(this.getValueToReplace(info.field.value, fragment), fragment, info.field.selectionStart, orchestrator);
      }

      private reviewQuerySyntax(value: string, position: number, orchestrator: IOrchestrator): boolean {
        let status = true, result = null;
        while(status && value !== '') {
          position = this.validLastPosition(this.getLastPosition(orchestrator.getQuery()));
          result = this.setPasteQuery(value, position, status, orchestrator) || { status: false, value: '' };
          status = result.status;
          value = result.value;
        }
        return status;
      }

      private getLastPosition(terms: Array<QueryElement>): any {
        return terms[terms.length - 1];
      }

      private validSearch(isOrderBy: boolean, state: number): boolean {
        return state === QueryState.PROPERTY_VALUE || (state === QueryState.INITIAL && isOrderBy) || this.validStateToSearch(state);
      }

      private getResultFragment(info: IQueryMapKeyboard, endPosition: number): string {
        if(info.field.selectionStart === info.field.selectionEnd) 
          return info.field.value.substring(endPosition, info.field.value.length);
        return info.field.value.substring(info.field.selectionStart, info.field.selectionEnd);
      }

      private validLastPosition(lastTerm: any): number {
        return typeof lastTerm === 'undefined' ? 0 : lastTerm.position.end + 1;
      }

      private setPasteQuery(value: string, position: number, status: boolean, orchestrator: IOrchestrator): Object {
        let result = this.setOperatorValue(value, position, status, orchestrator);
        if(result === null) {
          result = this.setPropertyValue(value, position, status, orchestrator);
        }
        return result;
      }

      private setOperatorValue(value: string, position: number, status: boolean, orchestrator: IOrchestrator): Object {
        let currentValue = orchestrator.getNextTerms(position).filter((x: string): boolean => { 
          return value.substring(0, x.length).toUpperCase() === x.toUpperCase() && value.substring(x.length, (x.length + 1)) === ' '; 
        });
        if (currentValue[currentValue.length - 1]) {
          return this.setNextValuePaste(currentValue[currentValue.length - 1], value, status, orchestrator);
        }
        return null;
      }

      private setPropertyValue(value: string, position: number, status: boolean, orchestrator: IOrchestrator): Object {
        if(orchestrator.getNextTerms(position).length > 0) return null;
        if(value.substring(0, 1).toString() === '\'') {
          return this.matchValueWithSpaces(value, status, orchestrator);
        }
        return this.setNextValuePaste(value.split(' ')[0], value, status, orchestrator);
      }

      private matchValueWithSpaces(value: string, status: boolean, orchestrator: IOrchestrator) {
        if(this.getMatchValue(value)) {        
          return this.setNextValuePaste(this.getMatchValue(value)[0], value, status, orchestrator);
        }
      }

      private getMatchValue(value: string) {
        return value.match(/'(.*?)'/);
      }

      private setNextValuePaste(current: string, value: string, status: boolean, orchestrator: IOrchestrator): Object {
        return { 
          value: value.substring(current.length, value.length).trim(), 
          status: this.setNewTerm(current, orchestrator) };
      }

      private validNextQueryState(value: string, orchestrator: IOrchestrator): boolean {
        let query : QueryElement = orchestrator.getQuery()[orchestrator.getQuery().length - 1];
        if(this.validValuePropNotRange(query, orchestrator, value)) return true;
        
        value = value.replace(/\'/g, '');
        return (this.validCommonValue(orchestrator, value) || this.validRangeValues(orchestrator, value));
      }

      private getObservableLastRange(elements: Array<QueryElement>) {
        return Rx.Observable.from(elements.map((x: any) => { return x.type }));
      }

      private getLastRangeIndex(source: any, lastIndex: number, inValues: Array<any>): any {
        source
        .lastIndexOf(QueryState.PROPERTY_MULTIPLE_VALUES)
        .subscribe((x) => {
          source
            .filter((val: number, idx: number) => {
                return idx > (lastIndex = x);
            })
            .flatMap((val, idx) => { return Rx.Observable.just(val); })
            .subscribe((o) => {
                inValues.push(o);
            });
        });
        return ({
          index: lastIndex,
          inValues: inValues
        });
      }

      private validCommonOperator(query: Array<QueryElement>): boolean {
        return query[query.length - 1].type === QueryState.OPERATOR_TERM || query[(query.length - 1 - 1)].type === QueryState.OPERATOR_TERM;
      }

      private validCommonValue(orchestrator: IOrchestrator, value: string): boolean {
        return this.validCommonOperator(orchestrator.getQuery()) && 
        (this.validValueIsNotOperator(orchestrator.getFullOperators(), value) || value.trim() !== '');
      }

      private validValueIsNotOperator(operators: Array<string>, value: string): boolean {
        return operators.map((x: string) => { return x.toLowerCase(); }).indexOf(value.toLowerCase()) === -1;
      }

      private validValuePropNotRange(term: QueryElement, orchestrator: IOrchestrator, value: string): boolean {
        return orchestrator.getQuery().length === 0 
        || (orchestrator.isValidQuery() && value === '') 
        || (orchestrator.isValidQuery() && ["AND", "*", "OR", "+", "ORDER BY"].indexOf(value.toUpperCase()) !== -1) 
        || !(this.validStatePropertyValue(term.type))
      }

      private validRangeValues(orchestrator: IOrchestrator, value: string): boolean {
        let result = this.getLastRangeIndex(this.getObservableLastRange(orchestrator.getQuery()), 0, value.trim() != '' ? value.split(' ') : []);
        return orchestrator.getQuery()[result.index].text.toUpperCase() === 'BETWEEN' ? result.inValues.length === 2 : result.inValues.length > 1
      }
      
      private validNonAbleCharsToAdd(char: string): boolean { 
        return ["", "'"].indexOf(char) > -1; 
      }

      private validChangesQuery(value: string, currentValue: string, currentState: number, orchestrator: IOrchestrator): boolean {
        return (value.trim() === currentValue.trim() 
          && (currentState === QueryState.INITIAL || currentState === QueryState.PROPERTY_VALUE) && !(orchestrator.isAdvancedState())) 
          || this.validChangesQueryWhenOrderBy(value.substring(currentValue.length, value.length).trim(), orchestrator.getIsOrderBy(), orchestrator.getDirectionalOrderBy());
      }

      private validChangesQueryWhenOrderBy(value: string, isOrderBy, directionals: Array<string>): boolean {
        return isOrderBy && directionals.indexOf(value.toUpperCase()) !== -1;
      }

      private validPropertyValue(orchestrator: IOrchestrator, position: number, value: string): boolean {
        if((!this.isChangedValue(value) && value.trim() !== "" && this.currentValidState.state)) return true;
        return this.getValidationPropertyValue(orchestrator, value, position);
      }

      private getValidationPropertyValue(orchestrator: IOrchestrator, value: string, position: number): boolean {
        if(!(orchestrator.getCurrentState() === QueryState.PROPERTY_MULTIPLE_VALUES || orchestrator.getCurrentState() === QueryState.PROPERTY_VALUE)) return this.validPropertyCommonValue(orchestrator, value, position);
        return this.validMultiplePropertyValues(orchestrator, position, value);
      }

      private validMultiplePropertyValues(orchestrator: IOrchestrator, position: number, value: string): boolean {
        return this.handleMultipleValues(orchestrator, this.getMatchValue(value), position);
      }

      private handleMultipleValues(orchestrator: IOrchestrator, matchValue: Array<any>, position: number): boolean {
        if(!matchValue) return false;
        return this.validEachPropertyValue(orchestrator, matchValue[1].split(' '), position) 
          && this.validRangeValues(orchestrator, matchValue[1]);
      }

      private validEachPropertyValue(orchestrator: IOrchestrator, propValues: Array<any>, position: number): boolean {
        let result = false;
        for(let idx in propValues) {
          result = this.validPropertyCommonValue(orchestrator, propValues[idx], position)
        }
        return result;
      }

      private validPropertyCommonValue(orchestrator: IOrchestrator, value: string, position: number): boolean {
        return orchestrator.validPropertyValue(position, value) && this.validValueIsNotOperator(orchestrator.getFullOperators(), value)
      }

      private validStatePropertyValue(state: number): boolean {
        return this.validStateToSearch(state) || state === QueryState.PROPERTY_VALUE;
      }

      private isChangedValue(value: string): boolean {
        return this.handleChangedValue(this.changedValue !== value , value);
      }

      private handleChangedValue(isChanged: boolean, value: string): boolean {
        this.changedValue = this.changedValue !== value ? value : this.changedValue;
        return isChanged;
      }

      private getValueToReplace(value: string, fragment : string): string {
        return value.split(fragment)[1];
      }

      private validStateToSearch(state: number): boolean {
        return state === QueryState.OPERATOR_TERM || state === QueryState.PROPERTY_MULTIPLE_VALUES;
      }

      private validAddNextReplaceValue(value: string, fragment: string, start: number, orchestrator: IOrchestrator): void {
        if(fragment.trim() === '' || typeof value === 'undefined') return;
        this.addNextTerm(value, start, orchestrator, true);
      }

      private setNewTerm(value: string, orchestrator: IOrchestrator): boolean {
        if(this.validNextQueryState(value, orchestrator)) {
          this.validNonAbleCharsToAdd(value.trim()) 
            ? orchestrator.setNextState() 
            : orchestrator.addTerm((orchestrator.isAdvancedState() && value.indexOf(' ') > -1
            && (this.validStateToSearch(orchestrator.getCurrentState())))
            ? value.split(' ') : value) != 0;
          this.saveLastExecutedQuery(orchestrator.getQuery());
          return true;
        }
        return false;
      }

      private saveLastExecutedQuery(query) {
        this.informationStorageHelper.setQueryValue(query);
      }
    }

    QueryBuilderFactory.$inject = ['$window', 'informationStorageHelper'];
    function QueryBuilderFactory($window: any, informationStorageHelper: any) {
        return new QueryBuilderService($window, informationStorageHelper);
    }
    
    angular
        .module(CPALS.modules.directives.MAIN)
        .factory('QueryBuilderService', QueryBuilderFactory);
}
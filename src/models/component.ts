/// <reference path="../../../../../../../../typings/angularjs/angular.d.ts" />

import { IOrchestrator } from '../core/orchestrator';
import { IQueryTranspiler } from '../core/transpiler';
import { IQueryMapKeyboard } from './helpers';

export interface IQueryBuilderScope extends ng.IScope {
    model: Object;
    onNewSearch?: any;
    tableView?: any;
    queryValue?: any;
    onBeforeOpenNewWindow?: any;
    openNewWindow?: boolean;
    isInputEmpty: () => boolean;
}

export interface IQueryBuilderController {
    selected: string;
    current: Object;
    orchestrator: IOrchestrator;
    queryTranspiler: IQueryTranspiler;
    shouldSearch: boolean;
    $scope: IQueryBuilderScope;
    currentPosition: number;

    instanceOrchestrator(): void;
    filterText(value : string): string;
    setNextState(value: string, position: number, shouldSearch: boolean): void;
    bindAllModel(item: string, $event: any): void;
    handleQueryPasted($event: any): void;
    getNextTerms($viewValue: string): Array<string>
    deleteAllFragments(): void;
    setDeleteStatement(info: IQueryMapKeyboard): void;
    setStatusValidity(info: IQueryMapKeyboard): boolean;
    setTypedQuery(value: string): void;
    setCursorPositionWhenRange(info: IQueryMapKeyboard): boolean
    getCursorPosition($event: any): void;
    keyValidations(info: IQueryMapKeyboard): void;
}

export interface IQueryBuilderService {
    filterText(orchestrator: IOrchestrator, value: string): string;
    bindAllModel(orchestrator: IOrchestrator, value: string, replaceValue: string, position: number): any;
    resetReplaceEvent(): void;
    resetTypedQuery(value: string): void;
    updateQueryState(type: number, isValid: boolean): Object;
    addNextTerm(value: string, position: number, orchestrator: IOrchestrator, deleteState: boolean): boolean;
    validStatus(info: IQueryMapKeyboard, orchestrator: IOrchestrator): boolean;
    handleOpenWindow(openWindow: boolean, onWindowActive: any): void;
    validStatusQuery(info: IQueryMapKeyboard, orchestrator: IOrchestrator, position: number): boolean
    validDeleteStatusQuery(info: IQueryMapKeyboard, currentState: number, query: string): boolean;
    validResetIconState(queryLen: number, value: string): boolean;
    validQueryMultipleValuesDelete(currentState: number, previousState: number): boolean;
    validShouldSearch(shouldSearch: boolean, isOrderBy: boolean, state: number): boolean;
    getNextTerms(position: number, value: string, orchestrator: IOrchestrator): Array<string>;
    getTermsJoined(orchestrator: IOrchestrator): string;
    getSimpleQuotesFromRange(orchestrator: IOrchestrator, info: IQueryMapKeyboard): boolean;
    detectQueryChanges(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void;
    resetTermsWhenDeletePerformed(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void;
    handleCopiedText(field: HTMLTextAreaElement, orchestrator: IOrchestrator): void
}

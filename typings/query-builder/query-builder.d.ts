/// <reference path="../angularjs/angular.d.ts" />

declare namespace QueryBuilder {

    export interface IOrchestrator {
        addTerm(term: any): number;
        removeTerm(): number;
        removeFromIndex(position: number): number;
        getCurrentState(): number;
        getPreviousState(): number;

        isValidQuery(): boolean;
        isAdvancedState(): boolean;
        removeAllTerms(): boolean;
        setNextState(term?: any): boolean;
        validateValues(terms?: any): boolean;
        validPropertyValue(position: number, value: string): boolean

        getNextTerms(position: number): Array<string>;
        getFullOperators(): Array<string>;
        getQueryProp(): string;
        getPropertyMapObject(term: string): any;
        getQuery(): Array<any>;
        getCurrentType(): string;
        getIsOrderBy(): boolean;
    }

    export interface IQueryTranspiler {
        transpileQuery(query: Array<any>): string;
    }

    export enum QueryKeyCode { 
        INTRO = 13, 
        DELETE = 8,
        SUPR = 46,
        SPACE = 32 
    }

    export enum QueryState { 
        WRITING, 
        DO 
    }

    export interface IQueryMapKeyboard {
        e: KeyboardEvent;
        keyCode: number;
        isCtrl: boolean;
        value: string;
        field: HTMLInputElement;
    }

    export interface IChangeObserver {
        oldValue: Object;
        newValue: Object;
    }

    export interface IQueryBuilderScope extends ng.IScope {
        model: Object;
        onFilter: any;
        tableView?: any;
        queryValue?: any;
        onBeforeOpenNewWindow?: any;
        openNewWindow?: boolean;
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
        filterText(viewValue: string): string;
        setNextState(value: string, position: number, shouldSearch: boolean): void;
        bindAllModel(item: string, $event: any): void;
        handleQueryPasted($event: any): void;
        getNextTerms(validAllPositions: boolean): Array<string>
        deleteAllFragments(): void;
        setDeleteStatement(info: IQueryMapKeyboard): void;
        setStatusValidity(info: IQueryMapKeyboard): boolean;
        setTypedQuery(value: string): void;
        setCursorPositionWhenRange(info: IQueryMapKeyboard): boolean
        getCursorPosition($event: any): void;
        keyValidations(info: IQueryMapKeyboard): void;
    }

	export interface IQueryBuilderService {
        pasteEvent: boolean;
        replaceEvent: boolean;
        replaceTerm: any;
        queryChanged: boolean;
        changedValue: string;
        typedQuery: string;
        currentValidState: any; 
        $window: any;
        informationStorageHelper: any;
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
        getValueQueryMultipleValuesDelete(value: string): string;
        getTermsJoined(orchestrator: IOrchestrator): string;
        getSimpleQuotesFromRange(orchestrator: IOrchestrator, info: IQueryMapKeyboard): boolean;
        getDefaultSortField(isOrderBy: boolean, defaultSort: Object): Object;
        getNextTerms(position: number, value: string, orchestrator: IOrchestrator);
        detectQueryChanges(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void;
        resetTermsWhenDeletePerformed(info: IQueryMapKeyboard, orchestrator: IOrchestrator): void;
        handleCopiedText(field: HTMLTextAreaElement, orchestrator: IOrchestrator): void;
    }

	export var IOrchestrator;
}

declare module 'querybuilder' {
    export = QueryBuilder;
}
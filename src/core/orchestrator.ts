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
    validValues(terms?: any): boolean;
    validPropertyValue(position: number, value: string): boolean

    getNextTerms(position: number): Array<string>;
    getFullOperators(): Array<string>;
    getQueryProp(): string;
    getPropertyMapObject(term: string): any;
    getQuery(): Array<any>;
    getCurrentType(): string;
    getIsOrderBy(): boolean;
    getDirectionalOrderBy(): Array<string>;
}

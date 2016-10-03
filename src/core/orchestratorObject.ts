/// <reference path="../../../../../../../../typings/moment/moment.d.ts" />
/// <reference path="../../../../../../../../typings/moment/moment-node.d.ts" />

import { QueryElement } from './queryElement';
import { IOrchestrator } from './orchestrator';
import { QueryState } from './queryState';

export module query.core { 

    export class Types {
      public static get REAL(): string { return "REAL" };
      public static get INTEGER(): string { return "INTEGER" };
      public static get STRING(): string { return "STRING" };
      public static get DATE(): string { return "DATE" };
      public static get DATETIME(): string { return "DATETIME" };
      public static get DATE_RANGE(): string { return "DATE_RANGE" };
      public static get BOOLEAN(): string { return "BOOLEAN" };
      public static get RANGE(): string { return "RANGE" };
    }

    class JavascriptTypes {
        public static get STRING(): string { return "string" };
    }

    export class Orchestrator implements IOrchestrator {
      private state: number;
      private valid: number;

      private queryProp: any;

      private type: string;
      private dateFormat: string;
      private dateTimeHourMinFormat: string;
      private dateTimeFormat: string;
      private dateTimeMillisecondsFormat: string;

      private isConcatOperator: boolean;
      private isOrderBy: boolean;
      private hasAdvancedState: boolean;

      private query: Array<QueryElement>;
      private nextTerms: Array<string>;
      private previousTerms: Array<string>;
      private concatOps: Array<string>;
      private propertyTerms: Array<string>;

      private propertyMap: Object;
      private operatorMap: Object;

      private ADVANCED_OPS: Array<string>;
      private ADVANCED_NEGATIVE_OPS: Array<string>;
      private SPECIFIED_OPS: Array<string>;
      private ORDER_BY: string;

      constructor(propertyMap: Object, operatorMap?: Object, concatOps?: Array<string>) {
        this.state = QueryState.INITIAL;
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

      addTerm(term: any): number {
        if ((this.state === QueryState.PROPERTY_MULTIPLE_VALUES && this.validValues(term))
            || (this.state === QueryState.PROPERTY_VALUE && this.validateValuesNoConcatOperators(term))
            || (this.state === QueryState.OPERATOR_TERM && this.validateValue(term))
            || this.validateTerm(term)) {
            this.previousTerms = this.nextTerms;
            this.queryProp = term;
            this.valid = 0;
            if (this.setNextState(term)) {
              if(!Array.isArray(term))
                this.query.push(new QueryElement(this.state === QueryState.PROPERTY_VALUE ? (<string>this.queryProp).toLowerCase() : this.queryProp, this.state, term, this.type, this.getPreviousPosition(), this.previousTerms));
              else
                term.forEach((t: string) => { this.query.push(new QueryElement(t, this.state, t, this.type, this.getPreviousPosition(), this.previousTerms)) });
            }
        }
        return this.state;
      }

      removeTerm(): number {
        if(this.state != QueryState.INITIAL || this.isOrderBy) {
          this.validDeleteOrderBy();
          this.query.pop();
          this.valid = 0;
          switch(this.state = this.query.length === 0 ? QueryState.INITIAL : this.query[this.query.length-1].type) {
            case QueryState.PROPERTY_TERM:
              this.nextTerms = this.isOrderBy ? this.getDirectionalOrderBy() : this.operatorMap[this.type];
              break;
            case QueryState.OPERATOR_TERM:
              this.nextTerms = [];
              break;
            case QueryState.PROPERTY_VALUE:
              this.valid = this.query[(this.query.length -1) -1].type === QueryState.PROPERTY_MULTIPLE_VALUES ? 0: 1;
              this.nextTerms = this.query[(this.query.length -1) -1].type === QueryState.PROPERTY_VALUE || this.query[(this.query.length -1) -1].type === QueryState.PROPERTY_MULTIPLE_VALUES ? [] : this.concatOps;
              break;
            case QueryState.CONCAT_TERM:
              this.nextTerms = this.propertyTerms;
              break;
            case QueryState.PROPERTY_MULTIPLE_VALUES:
              this.nextTerms = [];
              break;
            default:
              this.hasAdvancedState = false;
              this.nextTerms = this.propertyTerms;
              break;
          }
        }

        return this.state;
      }

      removeFromIndex(position: number): number {
        return this.getEndPositionFromRemoveIndex(this.getTermIndexByPosition(position));
      }

      getCurrentState(): number {
        return this.state;
      }

      getPreviousState(): number {
          return typeof this.query[(this.query.length - 1) - 1] !== 'undefined' ? 
            this.query[(this.query.length - 1) - 1].type : QueryState.INITIAL;
      }

      isValidQuery(): boolean {
        return Boolean(this.valid);
      }

      isAdvancedState(): boolean {
        return this.hasAdvancedState;
      }

      removeAllTerms(): boolean {
        let len = this.query.length;
        for (let idx = 0; idx < len; idx++) {
          this.removeTerm();
        }
        return this.query.length === 0;
      }

      setNextState(term?: any): boolean {
        switch(this.state) {
            case QueryState.PROPERTY_TERM:
              this.hasAdvancedState = ((this.state = this.isSetOperator(term) ? QueryState.PROPERTY_MULTIPLE_VALUES : QueryState.OPERATOR_TERM) === QueryState.PROPERTY_MULTIPLE_VALUES) || this.getCurrentType() === 'RANGE';
              if(this.isOrderBy) {
                this.state = QueryState.INITIAL;
                this.valid = 1;
              }
              this.nextTerms = this.setNextTermsFromOperator();
              break;
            case QueryState.OPERATOR_TERM:
              this.state = QueryState.PROPERTY_VALUE;
              this.valid = 1;
              this.nextTerms = this.concatOps;
              break;
            case QueryState.PROPERTY_VALUE:
              this.valid = this.hasAdvancedState && (!this.isConcatOperator || typeof term === 'undefined') ? 1 : 0;
              this.state = this.valid ? QueryState.PROPERTY_VALUE : QueryState.CONCAT_TERM;
              this.nextTerms = this.state === QueryState.PROPERTY_VALUE ? this.concatOps : this.propertyTerms;
              this.setOrderBy(term);
              break;
            case QueryState.PROPERTY_MULTIPLE_VALUES:
              this.state = QueryState.PROPERTY_VALUE;
              this.valid = 1;
              this.nextTerms = this.concatOps;
              break;
            default:
              this.state = QueryState.PROPERTY_TERM;
              this.nextTerms = this.setNextTermsFromProperty(term);
              break;
          }
          return true;
      }

      validValues(terms: any): boolean {
          if(!Array.isArray(terms)) terms = [terms];
          return terms.every((t: string) => {
            return this.validateValue(t);
          });
      }

      validPropertyValue(position: number, value: string): boolean {
        let query: QueryElement = this.query[this.getTermIndexByPosition(position)];
        if(typeof query === 'undefined' || !(query.type === QueryState.OPERATOR_TERM || query.type === QueryState.PROPERTY_VALUE || query.type === QueryState.PROPERTY_MULTIPLE_VALUES) || value.trim() === '') return false;
        return Boolean(this.validateValue(value, query.propType));
      }

      getNextTerms(position: number): Array<string> {
        if(this.query.length === 0 || this.query[this.query.length - 1].position.end + 1 === position || position === -1) return this.nextTerms;
        return this.getNextTermsByRangePosition(position);
      }

      getPropertyMapObject(term: string): any {
        return this.propertyMap[this.queryProp = Object.keys(this.propertyMap).filter((p) => { return this.propertyMap[p].name.toLowerCase() === term.toLowerCase(); })[0]];
      }

      getQueryProp(): string {
        return this.queryProp;
      }

      getQuery(): Array<QueryElement> {
        return this.query;
      }

      getCurrentType(): string {
        return this.type;
      }

      getIsOrderBy(): boolean {
        return this.isOrderBy;
      }

      getFullOperators(): Array<string> {
        return (["=", "IS", "!=", "!IS", "IS NOT", "<>", ">", ">=", "<", "<=", 
        "STARTS WITH", "ENDS WITH", "!IN", "!CONTAINS", 
        "NOT IN", "!==", "BETWEEN", "IN", "CONTAINS", "=="])
        .concat(this.getConcatOperatorsConfig())
        .concat(this.getDirectionalOrderBy());
      }

      getDirectionalOrderBy(): Array<string> {
        return (["ASC", "DESC"]);
      }

      private setPropertyTerms() {
        for (let p in this.propertyMap) this.propertyTerms.push(this.propertyMap[p].name);
        this.propertyTerms = this.propertyTerms.sort((a: string, b: string): any => {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        });
      }

      private setOrderBy(term: string): void {
        if(this.state === QueryState.CONCAT_TERM && term === this.ORDER_BY) this.isOrderBy = true;
      }

      private setNextTermsFromProperty(term: string): Array<string> {
        this.type = this.getPropertyMapObject(term).type;
        if(this.isOrderBy) return this.getDirectionalOrderBy();
        return this.operatorMap[this.type];
      }

      private getEndPositionFromRemoveIndex(idx: number): number {
        return this.handleRemoveWithIndex(idx, idx === -1 ? 0 : this.query[idx].position.end);
      }

      private handleRemoveWithIndex(idx: number, endPosition: number): number {
        if(this.query.length === 0 || idx === -1) return 0;
        while(idx < this.query.length) this.removeTerm();
        return endPosition;
      }

      private setNextTermsFromOperator(): Array<string> {
        if(this.isOrderBy) {
          return this.getFilterPropertyTerms(this.getOrderedProps(this.getTermOrderBy()));
        }
        return [];
      }

      private getFilterPropertyTerms(orderedProps: Array<string>): Array<string> {
        return this.propertyTerms.filter((x: string): boolean => {
          return orderedProps.indexOf(x) === -1;
        });
      }

      private getOrderedProps(termOrderBy: QueryElement): Array<string> {
        return this.query.filter((x: QueryElement): boolean => {
          return (x.position.start > termOrderBy.position.end) && x.type === 1;
        }).map((e: QueryElement): any => { return e.text; });
      }

      private getTermOrderBy(): QueryElement {
        return this.query.find((x: QueryElement): boolean => {
          return x.text === this.ORDER_BY;
        });
      }

      private validDeleteOrderBy(): void {
        let currentQry = this.query[this.query.length - 1];
        if(currentQry.type === QueryState.CONCAT_TERM && currentQry.text === this.ORDER_BY) this.isOrderBy = false;
      }

      private ensureMappingObjects(concatOps: Array<string>): void {
        this.mapConcapOperator(concatOps);
        this.mapOperators();
        this.mapProperties();
      }

      private mapConcapOperator(concatOps: Array<string>): void {
        for (let c in concatOps) {
          this.concatOps.push(concatOps[c]);
        }
      }

      private mapOperators(): void {
        for (let c in this.operatorMap) {
          let operations = [];
          for (let o in this.operatorMap[c]) {
            operations.push(this.operatorMap[c][o]);
          }
          this.operatorMap[c] = operations;
        }
      }

      private mapProperties() {
        for (let x in this.propertyMap) {
          var valid: boolean = false;
          for (let p in this.operatorMap) {
            if (p === this.propertyMap[x].type) {
              valid = true;
            }
          }
          if (!valid) throw "Invalid Operation Definition -- " + this.propertyMap[x] + " not defined.";
        }
      }

      private validateTerm(term: string): boolean {
        if(Array.isArray(term)) return false;
        return this.nextTerms.map((x: string): any => { return x.toLowerCase() }).indexOf(term.toLowerCase()) != -1;
      }

      private validateValuesNoConcatOperators(terms: any): boolean {
          if (!(this.isConcatOperator = typeof terms === JavascriptTypes.STRING && this.concatOps.indexOf(terms) > -1)) {
              return this.validValues(terms);
          }
          return this.isConcatOperator;
      }

      private validateValue(term: string, propType: string = this.type): boolean {
        let cleanTerm: string = term.replace(/((')|(\[)|(\()|(\])|(\)))/g, '');
        switch(propType) {
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
      }

      private isValidDate(date: string): boolean {
        return moment(date, this.dateFormat, true).isValid();
      }

      private isValidDateTime(dateTime: string): boolean {
          return moment(dateTime, this.dateTimeFormat, true).isValid() || moment(dateTime, this.dateTimeMillisecondsFormat, true).isValid() || moment(dateTime, this.dateTimeHourMinFormat, true).isValid();
      }
      
      private isSetOperator(term: string): boolean {
          return !!(this.ADVANCED_OPS.concat(this.SPECIFIED_OPS).indexOf(term) > -1);
      }

      private getOperatorsConfig(): Object {
        let PRIMITIVES_OPS = ["=", "IS", "!=", "!IS", "IS NOT", "<>"];
        let NUMBERS_VALID_OPS = Array.prototype.concat(PRIMITIVES_OPS, this.ADVANCED_OPS.concat([">", ">=", "<", "<="]).concat(this.SPECIFIED_OPS));
        let STRING_VALID_OPS = Array.prototype.concat(PRIMITIVES_OPS, this.ADVANCED_OPS.concat(["STARTS WITH", "ENDS WITH", "CONTAINS", "!CONTAINS"]).concat(this.SPECIFIED_OPS));
        let DATES_VALID_OPS = Array.prototype.concat(PRIMITIVES_OPS, this.ADVANCED_OPS).concat(this.SPECIFIED_OPS);
        let DATES_RANGE_VALID_OPS = DATES_VALID_OPS.concat([">", ">=", "<", "<="]);
        let BOOLEAN_VALID_OPS = ["=", "IS"];
        let RANGE_VALID_OPS = ["=", "IS", ">", ">=", "<", "<="];

        //should match the same types class
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
      }

      private getConcatOperatorsConfig(): Array<string> {
        return (["AND", "*", "OR", "+", "ORDER BY"]);
      }

      private getPreviousPosition(): number {
        return this.query.length === 0 ? -1 : this.query[this.query.length - 1].position.end;
      }

      private getTermIndexByPosition(position: number) {
        return this.getDataByPosition('findIndex', position);
      }

      private getNextTermsByRangePosition(position: number) {
        return this.handleNextTerms(this.getDataByPosition('find', position), position);
      }

      private handleNextTerms(element: QueryElement, position: number): Array<any> {
        if(!element) return this.nextTerms;
        return this.handleNextTermsWithFilter(this.getTermsFiltered(element.nextTerms, 
          element.text.substring(0, (position - element.position.start)).toLowerCase()));
      }

      private handleNextTermsWithFilter(termsFiltered: Array<any>): Array<any> {
        return termsFiltered.length > 1 ? termsFiltered : [];
      }

      private getTermsFiltered(nextTerms: Array<string>, item: string): Array<string> {
        return nextTerms.filter((x: string): boolean => {
          return x.toLowerCase().indexOf(item) > -1;
        });
      }

      private getDataByPosition(method: string, position: number): any {
        return this.query[method]((x: QueryElement): boolean => {
          return x.position.start <= position && x.position.end >= position
        });
      }
    }
}

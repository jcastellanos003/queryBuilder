import { QueryElement } from './queryElement';
import { IQueryTranspiler } from './transpiler';
import { QueryState } from './queryState';

export module transpiler.core {

    export class ESQueryTranspiler implements IQueryTranspiler {
      lastState: number;

      concatOpInValues: string;
      concatOpBetweenValues: string;
      concatStartsWith: string;
      concatNorInValues: string;
      concatNotContains: string;

      advancedOps: Array<string>;
      advancedNegativeOps: Array<string>;
      negativeOps: Array<string>;

      hasAdvancedOps: boolean;
      hasNegativeOps: boolean;
      isBetweenFirst: boolean;
      isBetweenSecond: boolean;
      isDateRange: boolean;
      isNegativeNotForRange: boolean;

      STARTS_WITH: string;
      BETWEEN: string;
      CONTAINS: string;
      NOT_CONTAINS: string;
      DATE_RANGE: string;

      constructor() {
          this.lastState = QueryState.INITIAL;
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

      transpileQuery(elements: Array<QueryElement>): string {
          let query: string = "";
          elements.forEach((element: QueryElement, idx: number) => {
              element.term = element.term.replace(/\'/g, '');
              switch(element.type) {
                  case QueryState.INITIAL:
                    query += this.parseOperator(element.term.toUpperCase());
                    break;
                  case QueryState.PROPERTY_TERM:
                    this.hasNegativeOps = this.hasAdvancedOps = false;
                    this.isDateRange = element.propType === this.DATE_RANGE;
                    query += element.term;
                    break;
                  case QueryState.OPERATOR_TERM:
                    case QueryState.CONCAT_TERM:
                      case QueryState.PROPERTY_MULTIPLE_VALUES:
                        this.isNegativeNotForRange = this.negativeOps.indexOf(element.term.toUpperCase()) > -1;
                        if (element.type === QueryState.PROPERTY_MULTIPLE_VALUES) {
                            this.hasNegativeOps = this.advancedNegativeOps.indexOf(element.term.toUpperCase()) > -1;
                            this.hasAdvancedOps = this.advancedOps.indexOf(element.term.toUpperCase()) > -1;
                        }
                        query += (element.type === QueryState.CONCAT_TERM && (this.hasAdvancedOps || this.hasNegativeOps) ? this.isBetweenSecond ? ']' : ')': '') 
                        + this.parseOperator(element.term.toUpperCase());
                    break;
                  case QueryState.PROPERTY_VALUE:
                    this.isBetweenFirst = elements[(idx - 1)].text === this.BETWEEN;
                    this.isBetweenSecond = elements[(idx - 1) - 1].text === this.BETWEEN;
                    query += this.getQuerySyntaxWhenIsPropValue(element, elements[idx - 1], elements[(idx - 1) - 1]);
                    break;
              }
          });
          return query +
          (elements[elements.length - 1].type === QueryState.PROPERTY_VALUE && (this.hasAdvancedOps || this.hasNegativeOps) ? this.isBetweenSecond ? ']' : ')' : '');
      }

      private getQuerySyntaxWhenIsPropValue(element: QueryElement, lastElement: QueryElement, preLastElement: QueryElement): string {
          return this.validSyntaxPropertyValue(lastElement, preLastElement) + this.parseEscaping(element.term) + this.validSyntaxOperatorValue(lastElement);
      }

      private validSyntaxPropertyValue(lastElement: QueryElement, preLastElement: QueryElement): string {
          if(lastElement.type !== QueryState.PROPERTY_VALUE) return '';
          if(preLastElement.text === this.BETWEEN) return this.concatOpBetweenValues;
          if(this.hasNegativeOps) return this.concatNorInValues;
          return this.concatOpInValues;
      }

      private validSyntaxOperatorValue(lastElement: QueryElement): string {
          if(lastElement.term.toUpperCase() === this.NOT_CONTAINS) return this.concatNotContains;
          if(lastElement.term.toUpperCase() === this.STARTS_WITH || lastElement.term.toUpperCase() === this.CONTAINS) return this.concatStartsWith;
          if(this.isNegativeNotForRange) return ')';
          return '';
      }

      private parseEscaping(query: string): string {
          let chars = ["+", "&&", "||", "-", "!", "(", ")", "{", "}", "[", "]", "^", "\"", "~", "\\", ":", "/"];
          for (let c in chars) {
              query = query.split(chars[c]).join("\\" + chars[c]).replace(/\\\\/g, '\\');
          }
          
          if(/\d\d\d\d-\d\d-\d\d$/g.test(query.replace(/\\/g, ''))){
             if (this.isBetweenFirst) return `${query}T00\\:00\\:00`;
             if (this.isBetweenSecond) return `${query}T23\\:59\\:59`;
             if (!(this.isDateRange)) 
                return `[${query}T00\\:00\\:00 TO ${query}T23\\:59\\:59]`;
             else if (this.isNegativeNotForRange)
                return '"' + query + '"';
          }
          if(/\s/g.test(query)) return '"' + query + '"'
          return query;
      }

      private parseOperator(operator: string): string {
          let mapOperators = {
              //PRIMITIVE OPERATORS
              "=": ":+",
              "IS": ":+",
              "!=": ":(NOT ",
              "!IS": ":(NOT ",
              "IS NOT": ":(NOT ",
              "<>": ":(NOT ",
              //NUMERIC OPERATORS
              ">": ":>",
              "<": ":<",
              ">=": ":>=",
              "<=": ":<=",
              //STRING OPERATORS
              "STARTS WITH": ":",
              "ENDS WITH": ":*",
              "CONTAINS": ":+*",
              "!CONTAINS": ":(* AND NOT *",
              //ADVANCED OPERATORS
              "IN": ":(",
              "==": ":(",
              "BETWEEN": ":[",
              "!IN": ":(* AND NOT ",
              "NOT IN": ":(* AND NOT ",
              "!==": ":(* AND NOT ",
              //CONCAT OPERATORS
              "AND": " AND ",
              "OR": " OR ",
              "*": " AND ",
              "+": " OR ",
              "ORDER BY": "&sort=",
              //DIRECTIONAL OPERATORS
              "ASC": ",ASC&",
              "DESC": ",DESC&"
          };
          return mapOperators[operator];
      }
    }
}

"use strict";
var Position = (function () {
    function Position(start, end) {
        this.start = start;
        this.end = start + end;
    }
    return Position;
}());
var QueryElement = (function () {
    function QueryElement(term, type, text, propType, previousLength, nextTerms) {
        this.term = term;
        this.type = type;
        this.text = text;
        this.propType = propType;
        this.previousLength = previousLength;
        this.nextTerms = nextTerms;
        this.position = new Position(previousLength + 1, text.length);
    }
    return QueryElement;
}());
exports.QueryElement = QueryElement;

//# sourceMappingURL=queryElement.js.map

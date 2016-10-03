"use strict";
var QueryReplaceElement = (function () {
    function QueryReplaceElement(value, position, startPosition) {
        if (value === void 0) { value = ''; }
        if (position === void 0) { position = -1; }
        if (startPosition === void 0) { startPosition = -1; }
        this.value = value;
        this.position = position;
        this.startPosition = startPosition;
    }
    return QueryReplaceElement;
}());
exports.QueryReplaceElement = QueryReplaceElement;

//# sourceMappingURL=queryReplaceElement.js.map

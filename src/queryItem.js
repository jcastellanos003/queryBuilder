"use strict";
var QueryItem = (function () {
    function QueryItem(icon, color, state) {
        if (icon === void 0) { icon = 'fa-times-circle'; }
        if (color === void 0) { color = '#22B557'; }
        if (state === void 0) { state = false; }
        this.icon = icon;
        this.color = color;
        this.state = state;
    }
    return QueryItem;
}());
exports.QueryItem = QueryItem;

//# sourceMappingURL=queryItem.js.map

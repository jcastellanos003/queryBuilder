"use strict";
(function (QueryState) {
    QueryState[QueryState["INITIAL"] = 0] = "INITIAL";
    QueryState[QueryState["PROPERTY_TERM"] = 1] = "PROPERTY_TERM";
    QueryState[QueryState["OPERATOR_TERM"] = 2] = "OPERATOR_TERM";
    QueryState[QueryState["PROPERTY_VALUE"] = 3] = "PROPERTY_VALUE";
    QueryState[QueryState["CONCAT_TERM"] = 4] = "CONCAT_TERM";
    QueryState[QueryState["PROPERTY_MULTIPLE_VALUES"] = 5] = "PROPERTY_MULTIPLE_VALUES";
})(exports.QueryState || (exports.QueryState = {}));
var QueryState = exports.QueryState;

//# sourceMappingURL=queryState.js.map

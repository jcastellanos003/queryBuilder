var widgets;
(function (widgets) {
    'use strict';
    var QueryBuilderConstants = (function () {
        function QueryBuilderConstants() {
        }
        Object.defineProperty(QueryBuilderConstants, "Default", {
            get: function () {
                return {
                    EVENTS: {
                        ON_NEW_SEARCH: 'onNewSearchEvent'
                    }
                };
            },
            enumerable: true,
            configurable: true
        });
        return QueryBuilderConstants;
    }());
    angular
        .module(CPALS.modules.directives.MAIN)
        .constant('queryBuilderConstant', QueryBuilderConstants.Default);
})(widgets || (widgets = {}));

//# sourceMappingURL=queryBuilder.constants.js.map

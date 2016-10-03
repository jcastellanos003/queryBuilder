module widgets {
    'use strict';

    declare var CPALS: any;

    class QueryBuilderConstants {
        static get Default():any {
            return {
                EVENTS: {
                    ON_NEW_SEARCH: 'onNewSearchEvent'
                }
            };
        }
    }
    angular
    .module(CPALS.modules.directives.MAIN)
    .constant('queryBuilderConstant', QueryBuilderConstants.Default);
}

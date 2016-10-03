/// <reference path="jquery/jquery.d.ts" />
/// <reference path="angularjs/angular.d.ts" />
/// <reference path="angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="angular-ui-router/angular-ui-router.d.ts" />
/// <reference path="angularjs/angular-resource.d.ts" />
/// <reference path="rx/rx-lite.d.ts" />
/// <reference path="rx/rx.d.ts" />
/// <reference path="rx/rx.async-lite.d.ts" />
/// <reference path="rx/rx.async.d.ts" />

/// <reference path="moment/moment-node.d.ts" />
/// <reference path="moment/moment.d.ts" />
/// <reference path="lodash/lodash.d.ts" />
/// <reference path="angularjs/angular-mocks.d.ts" />

/// <reference path="query-builder/query-builder.d.ts" />

declare var require: {
    <T>(path: string): T;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
}

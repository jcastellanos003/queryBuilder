"use strict";
String.prototype.startsWith = function (searchString, position) {
    'use strict';
    position = position || 0;
    return this.indexOf(searchString, position) === position;
};

//# sourceMappingURL=polyfill.string.startsWith.js.map

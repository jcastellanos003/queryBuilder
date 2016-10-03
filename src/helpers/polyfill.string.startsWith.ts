export interface String {
    startsWith(searchString: string, position?: number): boolean;
}

String.prototype.startsWith = function(searchString: string, position?: number): boolean {
    'use strict';
    position = position || 0;
    return this.indexOf(searchString, position) === position;
}
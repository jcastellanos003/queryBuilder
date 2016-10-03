'use strict';
var appConfig = require('app.config');
var HttpStatus = require('http-status-codes');

describe('CPALS.modules.AppConfig', function() {
    var ConfirmationOnCloseService = null;
    
    beforeEach(function() {
        angular.module(CPALS.modules.APP,[
            'ui.router',
            'pascalprecht.translate',
            'ngCacheBuster',
            'mgcrea.ngStrap',
            'ui.sortable',
            'ui.select',
            'ngToast',
            CPALS.modules.services.MAIN
        ]).config(appConfig);
    });
    beforeEach(angular.mock.module(CPALS.modules.APP));
    beforeEach(angular.mock.inject(function($rootScope, $state, $injector, $httpBackend, _ConfirmationOnCloseService_) {
        ConfirmationOnCloseService = _ConfirmationOnCloseService_;
        
        spyOn(ConfirmationOnCloseService, 'initialize');
        spyOn(ConfirmationOnCloseService, 'enable');
        $httpBackend.when('GET', 'i18n/en/global.json').respond(HttpStatus.OK, {});
        $httpBackend.when('GET', 'i18n/en/language.json').respond(HttpStatus.OK, {});
        $httpBackend.when('GET', 'i18n/en/ccrsDataTypes.json').respond(HttpStatus.OK, {});
        $injector.invoke($state.get('site').resolve.translatePartialLoader);
        $rootScope.$apply();
        $httpBackend.flush();
    }));
    
    it('should set HighChart thousandsSep property to empty string', function() {
        expect(Highcharts.getOptions().lang.thousandsSep).toBe('');
    });
    
    it('should initialize confirmationOnClose service', function() {
        expect(ConfirmationOnCloseService.initialize).toHaveBeenCalled();
    });
    
    it('should enable confirmationOnClose service', function() {
        expect(ConfirmationOnCloseService.enable).toHaveBeenCalled();
    });
});
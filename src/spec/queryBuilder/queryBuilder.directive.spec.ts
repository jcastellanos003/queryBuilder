
import 'directives/queryBuilder/queryBuilder.directive';

declare var CPALS: any;
declare var autosize: any;
declare var document: any;

let moduleName = CPALS.modules.directives.MAIN,
    directiveName = 'queryBuilder',
    tpl = require('directives/queryBuilder/queryBuilder.html');

describe(moduleName + '.' + directiveName, () => {
    let $scope = null,
        element = null,
        orchestrator = {
            getQuery: jasmine.createSpy("getQuery").and.returnValue([])
        },
        field = '',
        QueryBuilderController = {
            setNextState: jasmine.createSpy("setNextState"),
            filterText: jasmine.createSpy("filterText").and.returnValue(field),
            deleteAllFragments: jasmine.createSpy("deleteAllFragments"),
            setPasteEvent: jasmine.createSpy("setPasteEvent"),
            setTypedQuery: jasmine.createSpy("setTypedQuery"),
            setDeleteStatement: jasmine.createSpy("setDeleteStatement"),
            keyValidations: jasmine.createSpy("keyValidations"),
            setCursorPositionWhenRange: function () { },
            setStatusValidity: jasmine.createSpy("setStatusValidity"),
            instanceOrchestrator: jasmine.createSpy("instanceOrchestrator"),
            orchestrator: jasmine.createSpy("orchestrator").and.returnValue(orchestrator),
            selected: ''
        },
        $httpBackend = null,
        directiveHtml = '<query-builder query-value="queryValue"></query-builder>';
    beforeEach(angular.mock.module(
        moduleName, ($controllerProvider) => {
            $controllerProvider.register('QueryBuilderController', () => {
                return QueryBuilderController;
            });
        }));

    beforeEach(angular.mock.inject(($compile, $rootScope, _$httpBackend_) => {
        function onNewSearch () {
            return true;
        }
        $scope = $rootScope.$new();
        $scope.onNewSearch = onNewSearch;
        $scope.queryValue = "";
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET('scripts/app/directives/queryBuilder/queryBuilder.html').respond(200, tpl);
        element = $compile(directiveHtml)($scope);
        document.body.appendChild(element[0]);
        $scope.$digest();
        $httpBackend.flush();
    }));

    it('Should compile the directive' + directiveHtml, () => {
        expect(element.html()).not.toBe('');
    });

    it("Should setNextState method have to been colled when search Button is pressed", () => {
        var searchButton,
            selectionStart = 0;
        searchButton = angular.element(element[0].querySelector("#glassSearch"));
        searchButton.trigger('click');
        expect(QueryBuilderController.setNextState).toHaveBeenCalledWith(field, selectionStart, true);
        $scope.$apply();
    });

    it('should detect whether the input has value' + directiveHtml, () => {
        expect(element.isolateScope().isInputEmpty()).toBe(true);
        element.find('textarea').val('somenthing');
        expect(element.isolateScope().isInputEmpty()).toBe(false);
    });

    it('Should setPasteEvent method have been called when keydown on input tag', () => {
        var input = element.find('textarea');
        var event = document.createEvent('KeyboardEvent');
        event.initEvent("keydown", true, true);
        input[0].dispatchEvent(event);
        expect(QueryBuilderController.setTypedQuery).toHaveBeenCalled();
    });


    xit('Should call keyValidations method when keyup on input', () => {
        var input = element.find('textarea');
        var event = document.createEvent('KeyboardEvent');
        spyOn(QueryBuilderController, 'setCursorPositionWhenRange');
        event.initEvent("keyup", true, true);
        input[0].dispatchEvent(event);
        expect(QueryBuilderController.keyValidations).toHaveBeenCalled();
    });


    xit('Should set selection range when setCursorPositionWhenRange is true', () => {
        var input = element.find('textarea'),
            initalValue = "somenthing",
            event = document.createEvent('KeyboardEvent');
        spyOn(QueryBuilderController, 'setCursorPositionWhenRange').and.returnValue(true);
        event.initEvent("keyup", true, true);
        input.val(initalValue);
        input[0].dispatchEvent(event);
        expect(QueryBuilderController.setCursorPositionWhenRange).toHaveBeenCalled();
        expect(input.val()).toBe(initalValue + "''");
    });

    it('Should call instanceOrchestrator method when is focus on input', () => {
        var input = element.find('textarea');
        var event = document.createEvent('KeyboardEvent');
        event.initEvent("focus", true, true);
        input[0].dispatchEvent(event);
        expect(QueryBuilderController.instanceOrchestrator).toHaveBeenCalled();
    });

    it('Should modify the input value  on model change, when selected exist', () => {
        var selectedItem = 'MyItem';
        QueryBuilderController.selected = selectedItem;
        $scope.model = "AnyValue";
        $scope.$digest();
        $scope.model = "OtherValue";
        $scope.$digest();
        expect(element.find('textarea').val()).toBe(selectedItem);
    });

    it('Should clear the input value on model change, when selected doesn´t exist', () => {
        var selectedItem = null;
        QueryBuilderController.selected = selectedItem;
        $scope.model = "AnyValue";
        $scope.$digest();
        $scope.model = "OtherValue";
        $scope.$digest();
        expect(element.find('textarea').val()).toBe('');
    });

    it('Should autosize update method have been called when keydown on input tag', () => {
        var input = element.find('textarea');
        var event = document.createEvent('KeyboardEvent');
        spyOn(autosize, 'update');
        event.initEvent("keydown", true, true);
        input[0].dispatchEvent(event);
        expect(autosize.update).toHaveBeenCalled();
    });

    it('Should update status when keyup is fired', () => {
        var input = element.find('textarea');
        var event = document.createEvent('KeyboardEvent');
        event.initEvent("keyup", true, true);
        input[0].dispatchEvent(event);
        expect(QueryBuilderController.keyValidations).toHaveBeenCalled();
    });

    it("Should delete All fragments when new search is pressed", () => {
        var newSearchLink,
            selectionStart = 0;
        newSearchLink = element.find("a.new-search");
        var event = document.createEvent('MouseEvents');
        spyOn(autosize, 'update');
        event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        newSearchLink[0].dispatchEvent(event);
        expect(QueryBuilderController.deleteAllFragments).toHaveBeenCalled();
        expect(autosize.update).toHaveBeenCalled();
    });
});

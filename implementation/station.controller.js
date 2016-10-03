'use strict';

require('services/entities/station/station.service.js');
require('services/esentities/station/station.service');
require('services/entities/station/station.constants.js');
require('utils/helpers/tableViewModal.service.js');
var orchestrator = require('directives/queryBuilder/core/orchestratorObject');
var _ = require('lodash');

angular
    .module(CPALS.modules.entityResources.administration.STATION)
    .controller('StationController', StationController);

StationController.$inject = ['$scope', 'Station', 'ESStationService', 'TableViewModal', 'STATION_STATIC', 'TimeZone', 'COLORS', 'LayoutService', 'TableView', 'ParseLinks'];

function StationController($scope, Station, ESStationService, TableViewModal, STATION_STATIC, TimeZone, COLORS, LayoutService, TableView, ParseLinks) {
    var STATION_CODE = STATION_STATIC.PRIMARYKEY_NAME;

    var vm = this;

    vm.form = getStationEntity();
    vm.properties = getProperties();
    vm.find = find;
    vm.tableView = TableView.getSingletonByState(find, getTableViewConfig());
    TableViewModal.bind({
        scope: vm,
        service: Station,
        tableView: vm.tableView,
        template: STATION_STATIC.TEMPLATE,
        keyName: STATION_CODE
    });

    // ELASTIC SEARCH + QUERYBUILDER
    vm.viewModel = {
        stationCode: { name: "Airport Code", type: orchestrator.query.core.Types.STRING },
        cityName: { name: "City Name", type: orchestrator.query.core.Types.STRING },
        airportName: { name: "Airport Name", type: orchestrator.query.core.Types.STRING },
        stateCode: { name: "State Code", type: orchestrator.query.core.Types.STRING },
        swaStation: { name: "SWA Station", type: orchestrator.query.core.Types.BOOLEAN },
        contiguous: { name: "Contiguous", type: orchestrator.query.core.Types.BOOLEAN },
        pairingAlphaPrefixCode: { name: "Pair Prefix", type: orchestrator.query.core.Types.STRING },
        localTimeZoneName: { name: "Time Zone", type: orchestrator.query.core.Types.STRING },
        latitude: { name: "Latitude", type: orchestrator.query.core.Types.REAL },
        longitude: { name: "Longitude", type: orchestrator.query.core.Types.REAL },
        color: { name: "Base Color", type: orchestrator.query.core.Types.STRING },
        countryCode: { name: "Country Code", type: orchestrator.query.core.Types.STRING },
        domesticInternationalIndicator: { name: "Dom / Int", type: orchestrator.query.core.Types.STRING },
        usCustomsClearanceIndicator: { name: "US Customs Clearance", type: orchestrator.query.core.Types.STRING },
        a012: { name: "A012", type: orchestrator.query.core.Types.BOOLEAN }
    };
    vm.StationService = ESStationService;
    // END

    vm.colors = COLORS;
    vm.newStation = newStation;
    vm.createStation = createStation;
    vm.updateStation = updateStation;
    vm.deleteStation = deleteStation;
    vm.findWithEs = findWithEs;
    vm.keyboard = false;

    vm.alphaPrefixCodes = ['NONE', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    vm.domesticInternationalIndicators = [STATION_STATIC.DOMESTIC_INDICATOR, STATION_STATIC.INTERNATIONAL_INDICATOR];
    vm.onChangeDomesticInternationalIndicator = onChangeDomesticInternationalIndicator;
    vm.usInternationalClearanceIndicators = [STATION_STATIC.US_INTERNATIONAL_CLEARENCE_INDICATOR.POST, STATION_STATIC.US_INTERNATIONAL_CLEARENCE_INDICATOR.PRE];
    vm.usCustomsClearanceIndicators = vm.usInternationalClearanceIndicators;
    vm.timeZones = [];
    vm.saveMessage = STATION_STATIC.SAVE_MESSAGE;
    vm.updateMessage = STATION_STATIC.UPDATE_MESSAGE;
    vm.checkBoxState = false;
    vm.checkInternationalIndicator = checkInternationalIndicator;
    

    vm.resetForm = resetForm;
    vm.oldForm = "";

    LayoutService.setActiveAside('code-tables');
    vm.tableView.refresh();

    function getStationEntity() {
        return ({
            stationCode: '',
            cityName: '',
            airportName: '',
            stateCode: '',
            swaStation: false,
            contiguous: false,
            pairingAlphaPrefixCode: null,
            localTimeZoneName: '',
            a012: false,
            domesticInternationalIndicator: '',
            usCustomsClearanceIndicator: '',
            countryCode: '',
            latitude: 0,
            longitude: 0,
            color: null
        });
    }

    function getTableViewConfig() {
        var tableViewConfig = {
            defaultSort: {},
            defaultFilters: {
                swaStationsSelected: true
            },
            silentSorts: STATION_STATIC.TABLE_CONFIG.silentSorts
        };
        tableViewConfig.defaultSort[STATION_CODE] = 'a';
        return tableViewConfig;
    }

    function getProperties() {
        return ({
            isNewEntity: true
        });
    }

    function newStation() {
        TableViewModal.modal(STATION_STATIC.TITLE, getStationEntity(), $scope);
    }

    function createStation() {
        TableViewModal.save(vm.form, vm.properties.isNewEntity);
    }

    function updateStation(entity) {
        TableViewModal.modal(STATION_STATIC.UPDATE_TITLE, entity, $scope);
        vm.oldForm = angular.copy(entity);
    }

    function deleteStation() {
        TableViewModal.delete();
    }

    TimeZone.query({}).then(
        function (result) {
            _.each(result, function (timeZone) {
                vm.timeZones.push(timeZone.timeZoneName);
            });
        }
    );

    function onChangeDomesticInternationalIndicator(any) {
        if (vm.form.domesticInternationalIndicator !== STATION_STATIC.INTERNATIONAL_INDICATOR) {
            vm.usCustomsClearanceIndicators = [STATION_STATIC.US_DOMESTIC_CLEARANCE_INDICATOR];
            vm.form.usCustomsClearanceIndicator = vm.usCustomsClearanceIndicators[0];
            return;
        }else{
            vm.usCustomsClearanceIndicators = vm.usInternationalClearanceIndicators;
            vm.form.usCustomsClearanceIndicator = vm.usCustomsClearanceIndicators[0];
        }
    }

    function checkInternationalIndicator(){
        return vm.form.domesticInternationalIndicator === STATION_STATIC.INTERNATIONAL_INDICATOR;
    }

    function findWithEs(page, perPage, sort, filters, search) {
        if (search) {
            vm.checkBoxState = true;
            var propSwaExist = "";
            if(vm.tableView.state.filters.swaStationsSelected){
                propSwaExist = search.indexOf('swaStation') !== -1? '': 'swaStation:+' + vm.tableView.state.filters.swaStationsSelected + ' AND ';
            }

            if (search.indexOf('swaStation') !== -1) {
                vm.tableView.state.filters.swaStationsSelected = search.split('swaStation')[1].split(' ')[0].replace(/\:/, '').replace(/\+/, '').replace(/\-/, '') === 'true';
            }
            
            if (search.indexOf('color') !== -1) {
                var colorSelected = search.split('color')[1].split(' ')[0].replace(/\:/, '').replace(/\+/, '').replace(/\-/, '');
                
                for (var index = 0; index < vm.colors.length; index++) {
                    if (vm.colors[index].name.toLowerCase() === colorSelected) {
                        search = search.replace(colorSelected, vm.colors[index].id);
                    }
                }
            }
            
            var modifiedSearch = search.split('&sort=');
            
            if(modifiedSearch.length > 1) {
                search = propSwaExist + '(' + modifiedSearch[0] + ')&sort=' + modifiedSearch[1];
            }
            else {
                search = propSwaExist + '(' + search + ')';
            }
        } else {
            vm.checkBoxState = false;
            search = 'swaStation:+' + vm.tableView.state.filters.swaStationsSelected;
        }
        var parameters = {
            page: page,
            size: perPage,
            sort: ParseLinks.tableViewSortToArray(sort),
            query: search
        };

        return vm.StationService.find(parameters).then(function (result) {
            $scope.$emit('TableChange');
            return result;
        }, function (reason) {
            $scope.$emit('TableChange');
            return {
                data: [],
                totalCount: 0
            };
        });
    }

    function find(page, perPage, sort, filters, search) {
        vm.checkBoxState = false;
        if(search === null){
            return Station.find(page, perPage, sort, filters, search, vm.tableView.state.filters.swaStationsSelected).then(function (result) {
                $scope.$emit('TableChange');
                return result;
            });
        }else{
            return findWithEs(page, perPage, sort, filters, search);
        }
    }

    function resetForm() {
        if(!vm.properties.isNewEntity){
            angular.copy(vm.oldForm, vm.form);
        }else{
            angular.copy(getStationEntity(), vm.form);
        }
    }
}

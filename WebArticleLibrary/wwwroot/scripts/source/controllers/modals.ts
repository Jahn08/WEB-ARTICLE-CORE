import * as angular from 'angular';

type modalSettings = angular.ui.bootstrap.IModalSettings;

class ModalCtrl {
    static setUp(options: modalSettings): modalSettings {
        options.controllerAs = 'ctrl';    
        return options;
    }
}

export { ModalCtrl };

import { inject } from "../../app/inject";
import { AppSystem } from "../../app/system";
import { ui } from "angular";

@inject(AppSystem.DEPENDENCY_MODAL_INSTANCE)
class ResponseModalCtrl {
    content: string;

    constructor(private $modalInstance: ui.bootstrap.IModalInstanceService) { }

    closeModal() {
        if (confirm('Without a comment you cannot change the state. Continue?'))
            this.$modalInstance.close();
    }

    save() { this.$modalInstance.close(this.content); }
}

export { ResponseModalCtrl };

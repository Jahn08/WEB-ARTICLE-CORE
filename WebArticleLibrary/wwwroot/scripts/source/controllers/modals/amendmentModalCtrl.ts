import { inject } from "../../app/inject";
import { AppSystem } from "../../app/system";
import { IAmendment } from "../../services/api/amendmentRequest";
import { ui } from "angular";

interface IAmendmentDialogModel {
    selectionText?: string;

    isGlobal?: boolean;
    
    isReadonly?: boolean;

    amendment?: IAmendment;
}

@inject(AppSystem.DEPENDENCY_DIALOG_MODEL, AppSystem.DEPENDENCY_MODAL_INSTANCE)
class AmendmentModalCtrl {
    content: string;

    readonly selectionText: string;

    readonly cutSelectionText: string;

    readonly typeAddition: string;

    readonly isGlobal: boolean;

    readonly isReadonly: boolean;

    constructor(model: IAmendmentDialogModel,
        private $modalInstance: ui.bootstrap.IModalInstanceService) {
            if (model.amendment) {
                const strs = model.amendment.content.split(' - ');
                this.content = strs.length > 1 ? strs[1] : model.amendment.content;

                if (!model.selectionText)
                    model.selectionText = strs[0].replace(/\"/g, '');
            }

            const selection = model.selectionText || '';
            this.isGlobal = !selection.length ? true : model.isGlobal;
            
            this.selectionText = selection;
            this.cutSelectionText = selection.length > 100 ? selection.substr(0, 100) + "..." : selection;
            
            this.isReadonly = model.isReadonly;
        }

        closeModal() { this.$modalInstance.close(); }
        
        save() {
            this.content = `"${this.selectionText}" - ${this.content}`;
            this.$modalInstance.close(this.content);
        }
}

export { IAmendmentDialogModel, AmendmentModalCtrl };

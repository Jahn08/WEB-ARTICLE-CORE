import { HistoryObjectType, IHistory, IHistoryRecord } from "../../services/api/historyRequest";
import { AppSystem } from "../../app/system";
import { inject } from "../../app/inject";
import { StateService } from "@uirouter/core";
import { ui } from "angular";

interface IArticleHistoryDialogModel {
    histories: IHistory[];

    articleName: string;
    
    isArticleApproved: boolean;

    historyId?: number;
}

class HistoryRelationalRecord implements IHistoryRecord {
    object: string;
    oldValue: string;
    newValue: string;
    objectId?: number;
    objectType: HistoryObjectType;
    id: number;
    insertDate: Date;
    articleId: number;
    authorId: number;

    readonly toComment: boolean;

    readonly toArticle: boolean;

    constructor(record: IHistoryRecord, articleIsApproved: boolean) {
        Object.assign(this, record);

        if (this.object) {
            if (this.object.endsWith('VERSION'))
                this.toArticle = true;
            else if (articleIsApproved && this.object.startsWith('COMMENT'))
                this.toComment = true;
        }
    }
}

@inject(AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE, 
    AppSystem.DEPENDENCY_DIALOG_MODEL)
class ArticleHistoryModalCtrl {
    filteredHistories: IHistory[];

    readonly selectedId: number;

    readonly articleName: string;

    readonly histories: IHistory[];

    constructor(private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        private model: IArticleHistoryDialogModel) {
            this.articleName = this.model.articleName;

            this.filteredHistories = [];

            const articleApproved = this.model.isArticleApproved;
            this.histories = this.model.histories.map(h => {
                h.history = h.history.map(hr => new HistoryRelationalRecord(hr, articleApproved));
                return h;
            });

            if (this.model.historyId)
                this.selectedId = this.model.historyId;
        }

    closeModal() { this.$modalInstance.close(); }

    goToObject(obj: string, id: number) {
        const objType = obj.split(/[. ]/g)[0];

        this.filteredHistories = this.model.histories.filter(h => {
            const firstRecord = h.history[0];
            return firstRecord.object.startsWith(objType) && firstRecord.objectId === id;
        });
    }

    leaveObject() {
        this.filteredHistories = [];
    }

    goToArticle(id: number, commentId: number) {
        const url = this.$state.href("app.articleview", { id: id, commentId: commentId });
        window.open(url);
    }

    getValueDescription(objName: string): string {
        return objName.endsWith('VERSION') ? (objName.startsWith('CHILD') ?
            'ANOTHER VERSION WAS CREATED' : 'WAS CREATED AS A NEW VERSION') : '';
    }
}

export { IArticleHistoryDialogModel, ArticleHistoryModalCtrl };

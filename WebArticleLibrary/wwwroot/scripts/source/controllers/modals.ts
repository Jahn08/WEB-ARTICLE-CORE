import { inject } from "../app/inject";
import { AppSystem } from "../app/system";
import { ui } from "angular";
import { IHistory, IHistoryRecord, HistoryObjectType } from "../services/api/historyRequest";
import { StateService } from "@uirouter/angularjs";

interface IArticleHistoryDialogModel {
    histories: IHistory[];

    articleName: string;
    
    articleIsApproved: boolean;

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

    constructor(public readonly record: IHistoryRecord, articleIsApproved: boolean) {
        if (record.object) {
            if (record.object.endsWith('VERSION'))
                this.toArticle = true;
            else if (articleIsApproved && record.object.startsWith('COMMENT'))
                this.toComment = true;
        }
    }
}

@inject(AppSystem.DEPENDENCY_STATE, AppSystem.DEPENDENCY_MODAL_INSTANCE, AppSystem.DEPENDENCY_DIALOG_MODEL)
class ArticleHistoryModalCtrl {
    filteredHistories: IHistory[];

    readonly selectedId: number;

    readonly articleName: string;

    readonly histories: IHistory[];

    private model: IArticleHistoryDialogModel;

    constructor(private $state: StateService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        model: IArticleHistoryDialogModel) {
            this.articleName = model.articleName;

            this.filteredHistories = [];

            const articleApproved = this.model.articleIsApproved;
            this.histories = this.model.histories.map(h => {
                h.history = h.history.map(hr => new HistoryRelationalRecord(hr, articleApproved));
                return h;
            });

            if (model.historyId)
                this.selectedId = model.historyId;
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

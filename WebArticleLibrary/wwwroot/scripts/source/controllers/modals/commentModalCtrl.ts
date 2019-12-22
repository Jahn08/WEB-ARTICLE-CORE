import { ConverterService } from "../../services/converterService";
import { IComment, CommentStatus } from "../../services/api/commentRequest";
import { inject } from "../../app/inject";
import { AppSystem } from "../../app/system";
import { ui } from "angular";

interface ICommentDialogModel {
    parentId?: number;

    comments: IComment[];

    userNames: Record<number, string>;
}

@inject(AppSystem.DEPENDENCY_DIALOG_MODEL, ConverterService, AppSystem.DEPENDENCY_MODAL_INSTANCE, 
    AppSystem.DEPENDENCY_ESCAPING_SERVICE)
class CommentModalCtrl {
    parentId: number;
    
    comments: IComment[];

    private userNames: Record<number, string>;

    constructor(commentData: ICommentDialogModel,
        private converterSrv: ConverterService,
        private $modalInstance: ui.bootstrap.IModalInstanceService,
        private $sce: angular.ISCEService) { 
            this.parentId = commentData.parentId;
            this.comments = this.parentId ? commentData.comments: commentData.comments.filter(c => c.status != CommentStatus.DELETED);

            this.userNames = commentData.userNames;
        }

        isBlocked(status: CommentStatus): boolean { return status === CommentStatus.BLOCKED; }

        getUserName(authorId: number): string {
            return authorId && this.userNames ? this.userNames[authorId] : null;
        }

        getCommentContent(content: string): string {
            return content ? this.$sce.trustAsHtml(this.converterSrv.bytesToStr(content)) : null;
        }

        closeModal() { this.$modalInstance.close(); }
}

export { ICommentDialogModel, CommentModalCtrl };

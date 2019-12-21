import { ErrorService } from "../services/errorService";
import { AuthService } from "../services/authService";
import { UserRequest, UserStatus, IUserInfo, IUserSearch } from "../services/api/userRequest";
import { EnumHelper, AppSystem, Constants } from "../app/system";
import { PagedCtrl } from "./pagedCtrl";
import { ColumnIndex } from "../services/api/apiRequest";
import { CommentRequest } from "../services/api/commentRequest";
import { ui } from "angular";
import { ModalOpener } from "./modals";
import { StateService } from "@uirouter/angularjs";
import { inject } from "../app/inject";

@inject(ErrorService, AuthService, AppSystem.DEPENDENCY_STATE, UserRequest, CommentRequest, AppSystem.DEPENDENCY_MODAL_SERVICE)
class UserInfoCtrl extends PagedCtrl {
    readonly statuses: number[];
    
    selectedUser: IUserInfo;

    query: IUserSearch;

    users: IUserInfo[];

    userPages: number[];

    readonly goToUserPage: (pageIndex: number) => void;

    readonly sortUsers: (col: ColumnIndex) => void;

    private artNumber: Record<string, number>;
    
    private cmntNumber: Record<string, number>;

    constructor(errorSrv: ErrorService, authSrv: AuthService, 
        $state: StateService,
        private userReq: UserRequest,
        private commentReq: CommentRequest,
        private $modal: ui.bootstrap.IModalService) {
        super(errorSrv);

        this.query = {
            asc: false,
            colIndex: ColumnIndex.NAME,
            page: 1
        };

        this.statuses = EnumHelper.getKeys(UserStatus);

        this.goToUserPage = this.goToPage.bind(this);
        
        this.sortUsers = this.sortUsersInternally.bind(this);

        this.setCurrentUser(authSrv, ui => {
            if (!this.setUserInfo(ui))
                $state.go('app');
        }, $state);
    }

    private setUserInfo(userInfo: IUserInfo): boolean {
        this.userInfo = userInfo;

        if (!this.hasAdminStatus())
            return false;

        if (!this.users)
            this.getFilteredUsers();

        return true;
    }

    userHasAdminStatus(): boolean {
        const user = this.selectedUser;
        return user && user.status === UserStatus.ADMINISTRATOR;
    }

    getStatusCaption(status: UserStatus): string { return this.userReq.getStatusCaption(status); }

    setAdminStatus() { this.setStatus(UserStatus.ADMINISTRATOR); }

    private setStatus(status: UserStatus) {
        if (!this.selectedUser)
            return;

        this.processRequest(this.userReq.setUserStatus(this.selectedUser.id, status), 
            () =>  this.selectedUser.status = status);
    }

    setBannedStatus() { this.setStatus(UserStatus.BANNED); }

    setApprovedStatus() { this.setStatus(UserStatus.USER); }

    hasBannedStatus(): boolean { return this.hasStatus(UserStatus.BANNED); }

    private hasStatus(status: UserStatus) { 
        return this.selectedUser && this.selectedUser.status === status; 
    }

    hasApprovedStatus(): boolean { return this.hasStatus(UserStatus.USER); }

    
    selectRow(user: IUserInfo) {
        this.selectedUser = this.selectedUser && this.selectedUser.id === user.id ? null : user;
    }

    private goToPage(pageIndex: number) {
        if (this.query.page === pageIndex)
            return;

        this.getFilteredUsers(pageIndex);
    }
        
    getFilteredUsers(pageIndex?: number, col?: ColumnIndex, asc?: boolean) {
        const filterOptions =  { asc: asc, colIndex: col, page: pageIndex };
        const copiedQuery = this.copySearchQuery(this.query, filterOptions);

        this.processRequest(this.userReq.getUsers(copiedQuery), userData => {
            this.users = userData.data;
            this.cmntNumber = userData.cmntNumber;
            this.artNumber = userData.artNumber;
            
            this.userPages = this.getPageNumberArray(userData.dataCount, userData.pageLength);
            Object.assign(this.query, copiedQuery);
        });
    }

    getCommentCount(): number {
        const user = this.selectedUser;
        return (user ? this.cmntNumber[user.id] : null) || 0;
    }

    getArticleCount(): number {
        const user = this.selectedUser;
        return (user ? this.artNumber[user.id] : null) || 0;
    }

    private sortUsersInternally(col: ColumnIndex) {
        if (!this.userPages.length)
            return;

        const asc = col === this.query.colIndex ? !this.query.asc : true;
        this.getFilteredUsers(null, col, asc);
    }

    goToCommentsList() {
        const user = this.selectedUser;

        this.processRequest(this.commentReq.get({ 
            page: 1, colIndex: ColumnIndex.DATE, asc: true, userId: user.id, all: true 
        }), async commentData => {
            await new ModalOpener(this.$modal).openCommentModal({
                comments: commentData.data,
                userNames: commentData.userNames
            });
        });
    }
}

export { UserInfoCtrl };

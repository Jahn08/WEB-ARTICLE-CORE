import { ApiRequest, ISearchQuery, ISearchResult } from './apiRequest';
import { IPromise } from 'angular';

class UserRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'UserInfo');
    }

    getUserInfo(userId: number, getPhoto: boolean): IPromise<IUserInfo> {
        return this.getResource({ userId, getPhoto });
    }

    getUsers(query: IUserSearch): IPromise<IUserList> {
        return this.getResource(query, 'All');
    }

    setUserStatus(userId: number, status: UserStatus): IPromise<void> {
        return this.saveResource({
            userId: userId,
            status: status
        }, 'Status');
    }

    getStatusCaption(status: UserStatus): string {
        return status === UserStatus.USER ? 'user' : 
            (status === UserStatus.ADMINISTRATOR ? 'administrator' : 'banned');
    }

    saveUserInfo(userInfo: IUserInfo): IPromise<void> {
        return this.saveResource(userInfo);
    }

    confirmEmail(confirmationId: string): IPromise<void> {
        return this.getResource({ confirmationId: confirmationId }, 'ConfirmEmail');
    }

    resetPassword(email: string): IPromise<void> {
        return this.getResource({ email: email }, 'ResetPassword');
    }

    replacePassword(newPassword: string, confirmationId: string): IPromise<void> {
        return this.saveResource({ 
            newPassword: newPassword, 
            confirmationId: confirmationId 
        }, 'ReplacePassword');
    }
}

interface IUserInfo {
    status?: UserStatus;

    id?: number;

    name: string;
    
    password?: string;
    
    newPassword?: string;
    
    firstName?: string;

    lastName?: string;

    patronymicName?: string;
    
    email?: string;
    
    photo?: string;
    
    showPrivateInfo?: boolean;

    insertDate?: Date;

    expirationDate?: Date;

    newEmailExpirationDate?: Date;

    resetPasswordExpirationDate?: Date;
}

enum UserStatus	{
    USER,
    
    BANNED,

    ADMINISTRATOR = 5
}

interface IUserSearch extends ISearchQuery {
    name?: string;
    
    login?: string;

    email?: string;
    
    status?: UserStatus;
}

interface IUserList extends ISearchResult<IUserInfo> {
    cmntNumber: Record<string, number>;
    
    artNumber: number;
}

export { UserRequest, IUserInfo };

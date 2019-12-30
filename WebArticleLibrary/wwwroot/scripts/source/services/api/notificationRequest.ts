import { ApiRequest } from './apiRequest';
import { IPromise } from 'angular';

class NotificationRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'Notification');
    }

    get(userId: number): IPromise<INotification[]> {
        return this.getArrayResource({ userId: userId });
    }

    clear(notificationIds: number[]): IPromise<void> {
        if (!notificationIds.length)
            return;

        return this.removeResource({ ids: notificationIds });
    }		
}

interface INotification {
    id: number;
    
    date: Date;
    
    recipientID: number;
    
    text: string;
    
    historyId: number;
    
    articleId: number;
}

export { NotificationRequest, INotification };

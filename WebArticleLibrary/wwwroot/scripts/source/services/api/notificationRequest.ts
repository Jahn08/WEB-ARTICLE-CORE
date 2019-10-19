import { ApiRequest } from './apiRequest';
import { IPromise } from 'angular';

class NotificationRequest extends ApiRequest {
    constructor($resource: ng.resource.IResourceService) {
        super($resource, 'Notification');
    }

    get(userId: number): IPromise<INotification[]> {
        return this.getResource(userId);
    }

    clear(notificationIds: number[]): IPromise<void> {
        return this.removeResource(notificationIds);
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

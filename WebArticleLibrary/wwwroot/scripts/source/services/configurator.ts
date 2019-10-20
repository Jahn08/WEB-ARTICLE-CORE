import { UserRequest } from './api/userRequest';
import { AuthRequest } from './api/authRequest';
import { ContactRequest } from './api/contactRequest';
import { AuthService } from './authService';
import { ErrorService } from './errorService';
import { ConverterService } from './converterService';
import { ArticleRequest } from './api/articleRequest';
import { NotificationRequest } from './api/notificationRequest';
import { HistoryRequest } from './api/historyRequest';
import { AmmendmentRequest } from './api/amendmentRequest';
import { CommentRequest } from './api/commentRequest';
import { EstimateRequest } from './api/estimateRequest';
import { ComplaintRequest } from './api/complaintRequest';
import { AppSystem } from '../app/system';

const services: Array<Function> = [AuthService, ErrorService, UserRequest, 
    AuthRequest, ContactRequest, ConverterService, ArticleRequest,
    NotificationRequest, HistoryRequest, AmmendmentRequest, CommentRequest,
    EstimateRequest, ComplaintRequest];

const module = AppSystem.appModule;
services.forEach(srv => module.service(srv.name, srv));

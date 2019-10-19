import { UserRequest } from './services/api/userRequest';
import { AuthRequest } from './services/api/authRequest';
import { ContactRequest } from './services/api/contactRequest';
import { AuthService } from './services/authService';
import { ErrorService } from './services/errorService';
import { ConverterService } from './services/converterService';
import { ArticleRequest } from './services/api/articleRequest';
import { NotificationRequest } from './services/api/notificationRequest';
import { HistoryRequest } from './services/api/historyRequest';
import { AmmendmentRequest } from './services/api/amendmentRequest';
import { CommentRequest } from './services/api/commentRequest';
import { EstimateRequest } from './services/api/estimateRequest';
import { ComplaintRequest } from './services/api/complaintRequest';
import * as angular from 'angular';

const services: Array<Function> = [AuthService, ErrorService, UserRequest, 
    AuthRequest, ContactRequest, ConverterService, ArticleRequest,
    NotificationRequest, HistoryRequest, AmmendmentRequest, CommentRequest,
    EstimateRequest, ComplaintRequest];

const module = angular.module('ArticleLibraryApp');
services.forEach(srv => module.service(srv.name, srv));

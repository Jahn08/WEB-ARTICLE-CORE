import { UserRequest, IUserInfo, UserStatus } from "../services/api/userRequest";
import { BaseCtrl } from "./baseCtrl";
import { AuthService } from "../services/authService";
import { StateService } from "@uirouter/angularjs";
import { ErrorService } from "../services/errorService";
import { Constants, AppSystem } from "../app/system";
import { inject } from "../app/inject";

@inject(ErrorService, AuthService, UserRequest, AppSystem.DEPENDENCY_STATE)
class PropertiesCtrl extends BaseCtrl {
    private oldEmail: string;

    constructor(errorSrv: ErrorService,
        private authSrv: AuthService,
        private userReq: UserRequest,
        private $state: StateService) {
        super(errorSrv);

        this.setCurrentUser(this.authSrv, ui => {
            this.setUserInfo(ui);
            this.initPhoto();
            this.showConfirmationMessage();
        }, $state);
    }

    private setUserInfo(userInfo: IUserInfo) {
        this.userInfo = userInfo;
        this.oldEmail = userInfo.email;
    }

    private initPhoto() {
        if (!window.FileReader)
            return;

        $('#filePicture').on('change', (event: Event) => {
            const fileInput = event.target as HTMLInputElement;

            if (!fileInput)
                return;

            const file = fileInput.files[0];

            const fr = new FileReader();
            fr.onload = () => {
                const result = fr.result as string;
                
                if (!result)
                    return;

                const photo = result.split(',')[1];
                this.userInfo.photo = photo;
                $('#imgPicture').attr('src', result);
            };

            fr.readAsDataURL(file);
        });
    }

    private showConfirmationMessage() {
        if (this.$state.params.confirmEmail == 'true')
            alert('A message with a confirmation link was sent to your new email address.' +
                'Please, confirm your new email address through the link until it gets expired');
    }

    getStatusCaption(status: UserStatus): string {
        return this.userReq.getStatusCaption(status);
    }

    getUserPhoto(): string {
        if (!this.userInfo)
            return null;

        const contents = this.userInfo.photo;
        return contents ? 'data:image/jpeg;base64,' + contents : 
            Constants.NO_PHOTO_FILE_URL;
    }

    save() {
        this.processRequest(this.userReq.saveUserInfo(this.userInfo),
            async () => {
                await this.authSrv.logIn(this.userInfo, true);

                this.$state.transitionTo(this.$state.current, 
                    { confirmEmail: this.oldEmail !== this.userInfo.email }, 
                    { reload: true, inherit: false, notify: true });
            });
    }

    removePhoto() {
        $('#imgPicture').attr('src', Constants.NO_PHOTO_FILE_URL);
        this.userInfo.photo = null;
    }
}

export { PropertiesCtrl };

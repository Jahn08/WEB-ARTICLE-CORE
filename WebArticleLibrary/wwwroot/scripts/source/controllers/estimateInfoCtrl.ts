import { BaseCtrl } from "./baseCtrl";
import { ErrorService } from "../services/errorService";
import { IEstimateSearch, EstimateRequest, IEstimate, EstimateType } 
    from "../services/api/estimateRequest";
import { PagedQuery } from "../app/pagedQuery";
import { ColumnIndex } from "../services/api/apiRequest";
import { AuthService } from "../services/authService";
import { EnumHelper, AppSystem } from "../app/system";
import { StateService } from "@uirouter/core";
import { inject } from "../app/inject";

@inject(ErrorService, AuthService, AppSystem.DEPENDENCY_STATE, EstimateRequest)
class EstimateInfoCtrl extends BaseCtrl {
    estimates: IEstimate[];

    selectedEstimate: IEstimate;
    
    query: IEstimateSearch;

    types: EstimateType[];

    pages: number[];

    readonly goToPage: (pageIndex: number) => void;

    readonly sortEstimates: (col: ColumnIndex) => void;

    private readonly pagedQuery: PagedQuery<IEstimateSearch>;

    private articleNames: Record<number, string>;

    constructor(errorSrv: ErrorService,
        authSrv: AuthService,
        $state: StateService,
        private estimateReq: EstimateRequest) {
        super(errorSrv);

        this.types = EnumHelper.getKeys(EstimateType);

        this.query = {
            asc: false,
            page: 1,
            colIndex: ColumnIndex.DATE
        };

        this.pagedQuery = new PagedQuery(this.query, this.filterItems.bind(this));
        this.goToPage = this.pagedQuery.goToPage.bind(this.pagedQuery);
        this.sortEstimates = this.sortItems.bind(this);

        this.setCurrentUser(authSrv, () => {
            this.filterEstimates();
        }, $state);
    }

    private sortItems(col: ColumnIndex) { this.pagedQuery.sortItems(col, this.pages); }

    filterEstimates() { this.pagedQuery.filterItems(); }

    private filterItems(filterQuery: IEstimateSearch) {
        this.estimateReq.get(filterQuery).then(estimateData => {
            this.estimates = estimateData.data;
            this.articleNames = estimateData.articleNames;

            this.pages = PagedQuery.getPageNumberArray(estimateData.dataCount, 
                estimateData.pageLength);
            Object.assign(this.query, filterQuery);

            this.selectedEstimate = null;
        });
    }

    sselectEstimate(est: IEstimate) {
        this.selectedEstimate = this.selectedEstimate && this.selectedEstimate.id === est.id ? 
            null : est;
    }

    getArticleName(est: IEstimate) {
        return est ? this.articleNames[est.articleId] : null;
    }

	getEstimateTypeCaption(estType: EstimateType) {
        return this.estimateReq.getTypeCaption(estType);
    }
}

export { EstimateInfoCtrl };

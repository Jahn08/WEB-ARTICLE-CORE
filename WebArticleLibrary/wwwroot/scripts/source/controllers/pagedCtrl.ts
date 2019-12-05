import { BaseCtrl } from "./baseCtrl";
import { ErrorService } from "../services/errorService";
import { ISearchQuery } from "../services/api/apiRequest";

class PagedCtrl extends BaseCtrl {
    constructor(errorSrv: ErrorService) {
        super(errorSrv);
    }

    protected getPageNumberArray(dataLength: number, pageLength: number): number[] {
        return new Array(Math.ceil(dataLength / pageLength));
    }

    protected copySearchQuery(source: ISearchQuery, options: ISearchQuery): ISearchQuery {
        const newQuery = Object.assign({}, source);

        if (options.page != null)
            newQuery.page = options.page;
            
        if (options.colIndex != null)
            newQuery.colIndex = options.colIndex;

        if (options.asc != null)
            newQuery.asc = options.asc;

        return newQuery;
    }
}

export { PagedCtrl };

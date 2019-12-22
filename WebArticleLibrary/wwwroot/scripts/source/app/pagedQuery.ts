import { ISearchQuery, ColumnIndex } from "../services/api/apiRequest";

class PagedQuery<TQuery extends ISearchQuery> {
    constructor(private query: TQuery, 
        private queryProcessor: (searchQuery: TQuery) => void) { }

    static getPageNumberArray(dataLength: number, pageLength: number): number[] {
        return new Array(Math.ceil(dataLength / pageLength));
    }

    goToPage(pageIndex: number) {
        if (this.query.page === pageIndex)
            return;

        this.filterItems({
            page: pageIndex,
            asc: null,
            colIndex: null   
        });
    }

    filterItems(filterQuery?: ISearchQuery) {
        this.queryProcessor(this.copySearchQuery(this.query, filterQuery));
    }

    copySearchQuery(source: ISearchQuery, options: ISearchQuery): TQuery {
        const newQuery = Object.assign({}, source) as TQuery;

        if (options) {
            if (options.page != null)
                newQuery.page = options.page;
            
            if (options.colIndex != null)
                newQuery.colIndex = options.colIndex;

            if (options.asc != null)
                newQuery.asc = options.asc;
        }
        
        return newQuery;
    }

    sortItems(col: ColumnIndex, pages: number[]) {
        if (!pages.length)
            return;

        const asc = col === this.query.colIndex ? !this.query.asc : true;

        this.filterItems({
            page: null,
            asc: asc,
            colIndex: col   
        });
    }
}

export { PagedQuery };

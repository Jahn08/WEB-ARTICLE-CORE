import * as angular  from "angular";

class DirectiveFactory {
    private static readonly ATTRIBUTE_RESTRICTION: string = 'A';

    private static readonly ELEMENT_RESTRICTION: string = 'E';

    static clickDisabled(): angular.IDirective<IDisablableDirectiveScope> {
        return {
            restrict: DirectiveFactory.ATTRIBUTE_RESTRICTION,
            scope: {
                disabled: '=clickDisabled'
            },
            link: (scope, el) => {
                el.on('click', () => !scope.disabled);
            }
        };
    }
        
    static limitedVal(): angular.IDirective {
        return {
			restrict: DirectiveFactory.ELEMENT_RESTRICTION,
			scope: {
				value: '=',
				length: '='
			},						
			template: '<div title="{{value}}">{{value|limitToFormat:length}}</div>'
		};
    }

	static sortBtn(): angular.IDirective {
        return {
			restrict: DirectiveFactory.ELEMENT_RESTRICTION,
			scope: {
				name: '=',
				asc: '=',
				colIndex: '=',
				fnClick: '=',
				curColIndex: '='
			},						
			templateUrl: 'views/directives/SortBtn.html'
		};
    }

    static pagination(): angular.IDirective {
        return {
			restrict: DirectiveFactory.ELEMENT_RESTRICTION,
			scope: {
				pages: '=',
				curPage: '=',
				fnNextPage: '=',
				addParam: '='
			},						
			templateUrl: 'views/directives/Pagination.html'
		};
    }

    static breadcrumb(): angular.IDirective<ILinkableDirectiveScope> {
        return {
			restrict: DirectiveFactory.ELEMENT_RESTRICTION,
			scope: {
				links: '='
			},
			link: (scope) => {
				scope.states = scope.links.split('|').map(v => {
					const vals = v.split(':');
					return { name: vals[0], state: vals.length > 1 ? vals[1]: null };
				});
			},
			templateUrl: 'views/directives/Breadcrumb.html'
		};
    }

	static loading(): angular.IDirective {
		return {
			restrict: DirectiveFactory.ELEMENT_RESTRICTION,
			scope: {
				msg: '=',
				isError: '=',
				sending: '='
			},
			templateUrl: 'views/directives/Loading.html'
		};
	}
}

interface IDisablableDirectiveScope extends angular.IScope {
    disabled: boolean;
}

interface ILinkableDirectiveScope extends angular.IScope {
    links: string;

    states: { name: string, state: string}[];
}

export { DirectiveFactory };

class DashboardState {
	constructor() {
		StorageUtils.clearTransientData();

		this.preferences = {
			itemsPerPage: StorageUtils.getNumber(STORAGE_KEYS.PAGINATION_LIMIT, 30),
			filters: {
				role: StorageUtils.getString(STORAGE_KEYS.ROLE_FILTER, 'ALL'),
				timeframe: StorageUtils.getString(STORAGE_KEYS.TIMEFRAME, 'MONTH'),
				mapTab: StorageUtils.getString(STORAGE_KEYS.MAP_TAB, 'SURVIVOR')
			},
			ui: {
				dashboardExpanded: StorageUtils.getBooleanDefaultTrue(STORAGE_KEYS.DASH_MAIN_EXP),
				killersExpanded: StorageUtils.getBooleanDefaultTrue(STORAGE_KEYS.DASH_KILLERS_EXP),
				unifiedMapsExpanded: StorageUtils.getBooleanDefaultTrue(STORAGE_KEYS.DASH_MAPS_EXP)
			}
		};

		this.pagination = {
			currentPage: this._initPaginationFromURL(),
			totalPages: 1
		};

		this.data = {
			targetPageData: [],
			expandedRows: new Set(),
			portraitsCache: Object.create(null)
		};
	}

	_initPaginationFromURL = () => {
		const url = new URL(window.location);
		const pageParam = url.searchParams.get('page');

		if (!pageParam) {
			url.searchParams.set('page', '1');
			window.history.replaceState({}, '', url);
			return 1;
		}
		return parseInt(pageParam, 10) || 1;
	}
}
const STORAGE_KEYS = Object.freeze({
	PAGINATION_LIMIT: 'custom_pps_limit',
	ROLE_FILTER: 'custom_role_filter',
	TIMEFRAME: 'custom_dashboard_tf',
	MAP_TAB: 'custom_map_tab',
	DASH_MAIN_EXP: 'dash_main_exp',
	DASH_KILLERS_EXP: 'dash_killers_exp',
	DASH_MAPS_EXP: 'dash_unified_maps_exp',
	OFFSET: 'offset-mh'
});

const StorageUtils = {
	getNumber: (key, fallback) => {
		const value = parseInt(localStorage.getItem(key), 10);
		return Number.isNaN(value) ? fallback : value;
	},
	getString: (key, fallback) => localStorage.getItem(key) ?? fallback,

	// Handles the specific string 'false' check cleanly
	getBooleanDefaultTrue: (key) => localStorage.getItem(key) !== 'false',

	clearTransientData: () => {
		sessionStorage.clear();
		localStorage.removeItem(STORAGE_KEYS.OFFSET);
	}
};
(function () {
	'use strict';

	try {
		const dbdApp = new DbDDashboardApp();
		dbdApp.start();
	} catch (err) {
		console.error("[DbD Dashboard] Fatal Initialization Error:", err);
	}
})();
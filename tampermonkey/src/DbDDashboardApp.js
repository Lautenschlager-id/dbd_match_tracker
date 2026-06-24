const APP_CONFIG = Object.freeze({
	API_TARGET: 'account-backend.bhvr.com/player-stats/match-history/games/dbd/providers/steam',
	MATCH_WRAPPER_SELECTOR: 'div.mx-auto.flex.w-full.grow.flex-col.items-start'
});

const StyleInjector = {
	init: () => {
		if (document.getElementById('custom-dashboard-styles')) return;

		const css = `
			.custom-scrollbar-panel::-webkit-scrollbar {
				width: 4px;
			}

			.custom-scrollbar-panel::-webkit-scrollbar-track {
				background: rgba(0, 0, 0, 0.05);
			}

			.custom-scrollbar-panel::-webkit-scrollbar-thumb {
				background: rgba(255, 255, 255, 0.08);
				border-radius: 4px;
			}

			.custom-scrollbar-panel::-webkit-scrollbar-thumb:hover {
				background: #ff0055;
			}

			.premium-killer-gradient {
				background-image: linear-gradient(157deg, oklab(0.432882 0.13315 0.0673657 / 0.2) 0px, oklab(0 0 0 / 0) 80%) !important;
			}

			.premium-survival-gradient {
				background-image: linear-gradient(157deg, oklab(0.372685 -0.0166675 -0.0297666 / 0.4) 0px, oklab(0.231712 -0.0127963 -0.0217157 / 0.25) 80%) !important;
			}

			.custom-stripe-dark-even {
				background-color: rgba(0, 0, 0, 0.38) !important;
			}

			.custom-stripe-dark-odd {
				background-color: rgba(255, 255, 255, 0.015) !important;
			}

			@keyframes fadeIn {
				from {
					opacity: 0;
					transform: translateY(-2px);
				}

				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			.animate-fade-in {
				animation: fadeIn 0.18s cubic-bezier(0.4, 0, 0.2, 1) forwards;
			}

			.tf-tab-btn {
				background: transparent;
				color: #94a3b8;
				border: none;
				outline: none;
				padding: 4px 9px;
				font-size: 0.72rem;
				font-weight: 600;
				cursor: pointer;
				border-radius: 2px;
				transition: all 0.2s ease;
			}

			.tf-tab-btn:hover {
				color: #f1f5f9;
			}

			.tf-tab-btn.tf-active {
				background-color: #1e293b;
				color: #ffffff;
			}

			.text-accent-highlight {
				color: #ff0055;
			}

			.custom-toolbar-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				margin-top: 5px;
			}

			.custom-mini-tabs-bar {
				background-color: rgba(0, 0, 0, 0.32) !important;
				border: 1px solid rgba(255, 255, 255, 0.08);
				display: inline-flex;
				gap: 2px;
			}

			.mini-action-btn {
				border: 1px solid transparent !important;
				width: 44px;
				height: 38px;
				cursor: pointer;
				position: relative;
			}

			.tab-active-all {
				background-color: #2e3c4e !important;
				border-color: rgba(255, 255, 255, 0.15) !important;
			}

			.tab-active-surv {
				background-color: rgba(29, 78, 216, 0.6) !important;
				border-color: rgba(59, 130, 246, 0.4) !important;
				box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
			}

			.tab-active-kill {
				background-color: rgba(185, 28, 28, 0.6) !important;
				border-color: rgba(239, 68, 68, 0.4) !important;
				box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
			}

			.custom-tooltip-wrapper {
				position: relative;
				display: inline-block;
			}

			.custom-tooltip-box {
				position: absolute;
				z-index: 9999;
				left: 50%;
				bottom: 48px;
				transform: translateX(-50%);
				opacity: 0;
				pointer-events: none;
				transition: opacity 0.15s ease, transform 0.15s ease;
			}

			.custom-tooltip-wrapper:hover .custom-tooltip-box {
				opacity: 1;
				transform: translateX(-50%) translateY(-2px);
			}

			.tooltip-arrow-pointer {
				display: flex;
				justify-content: center;
				margin-top: -1px;
			}

			.icon-container-root {
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 100%;
				height: 100%;
			}

			.custom-fixed-glow-shell {
				position: absolute !important;
				width: 56px !important;
				height: 56px !important;
				left: 50% !important;
				top: 50% !important;
				transform: translate(-50%, -50%) !important;
				z-index: 0;
			}

			.bg-secondary-softlight {
				background-color: rgba(255, 255, 255, 0.35);
				width: 28%;
				height: 28%;
			}

			.custom-pagination-layout {
				display: flex;
				align-items: center;
				gap: 12px;
				font-family: sans-serif;
			}

			.custom-pagination-layout button,
			.custom-page-dropdown {
				background-color: #1e293b;
				color: #f8fafc;
				border: 1px solid #475569;
				padding: 5px 12px;
				border-radius: 4px;
				cursor: pointer;
				font-weight: 600;
				font-size: 0.8rem;
				transition: all 0.2s ease;
				outline: none;
			}

			.custom-page-dropdown {
				padding: 4px 6px;
			}

			.custom-page-dropdown option {
				background-color: #0f172a;
				color: #f8fafc;
			}

			.custom-pagination-layout button:hover:not(:disabled),
			.custom-page-dropdown:hover {
				background-color: #ff0055;
				border-color: #ff0055;
				box-shadow: 0 0 8px rgba(255, 0, 85, 0.4);
			}

			.custom-pagination-layout button:disabled {
				opacity: 0.3;
				cursor: not-allowed;
			}

			.custom-pagination-layout span {
				font-size: 0.85rem;
				letter-spacing: 0.5px;
				color: #94a3b8;
			}

			.custom-pagination-layout .ui-divider-pipe {
				margin: 0 1px;
				opacity: 0.15;
				color: #94a3b8;
			}

			.custom-view-all-killers-btn {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				gap: 6px;

				height: 32px;
				padding: 0 12px;

				border-radius: 4px;

				background: rgba(255, 255, 255, .04);
				border: 1px solid rgba(255, 255, 255, .08);

				color: #cbd5e1;

				font-size: 13px;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: .04em;

				cursor: pointer;

				transition:
					background .18s ease,
					border-color .18s ease,
					color .18s ease,
					transform .18s ease;
			}

			.custom-view-all-killers-btn:hover {
				background: rgba(255, 0, 85, .12);
				border-color: rgba(255, 0, 85, .35);
				color: #ffffff;
			}

			.custom-view-all-killers-btn:active {
				transform: translateY(1px);
			}

			.modal-overlay {
				position: fixed;
				inset: 0;
				z-index: 999999;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.modal-backdrop {
				position: fixed;
				inset: 0;
				background: rgba(0, 0, 0, 0.90);
				z-index: -1;
			}
		`;

		const styleNode = document.createElement('style');
		styleNode.id = 'custom-dashboard-styles';
		styleNode.textContent = css;
		document.head.appendChild(styleNode);
	}
};

/**
* Application Orchestrator
* Ties together the state, analytics engine, interceptors, and UI controllers.
*/
class DbDDashboardApp {
	constructor() {
		// Initializes user preferences, storage wrappers, and default pagination
		this.appState = new DashboardState();

		// Grab the master JSON and feed it into our analytics engine
		const rawData = GM_getResourceText("MASTER_JSON");

		this.analyticsEngine = new DbDMatchAnalytics(rawData, {
			activeRole: this.appState.preferences.filters.role,
			activeTimeframe: this.appState.preferences.filters.timeframe,
			currentPage: this.appState.pagination.currentPage,
			itemsPerPage: this.appState.preferences.itemsPerPage
		});

		StyleInjector.init();

		// Setup the network interceptor
		this.interceptor = new XHRInterceptor(
			APP_CONFIG.API_TARGET,
			(liveResponseText) => this._handleNetworkIntercept(liveResponseText)
		);
	}

	start() {
		this.interceptor.enable();
		console.log("[DbD Dashboard] Application Bootstrapped & Listening.");
	}

	/**
	* Syncs the Analytics Engine output with the App State
	*/
	_syncPaginationData() {
		this.analyticsEngine.state.activeRole = this.appState.preferences.filters.role;
		this.analyticsEngine.state.itemsPerPage = this.appState.preferences.itemsPerPage;
		this.analyticsEngine.state.currentPage = this.appState.pagination.currentPage;

		const slices = this.analyticsEngine.getPaginationSlices();
		this.appState.data.targetPageData = slices.targetPageData;
		this.appState.pagination.totalPages = slices.totalPages;
	}

	/**
	* Fired every time the target XHR endpoint is intercepted
	*/
	_handleNetworkIntercept(liveResponseText) {
		// Parse the response from the real endpoint
		let liveData = [];
		try {
			if (liveResponseText) {
				liveData = JSON.parse(liveResponseText);
			}
		} catch (e) {
			console.error("Failed to parse live endpoint response", e);
		}

		this.analyticsEngine.mergeHistory(this.analyticsEngine.masterList, liveData);

		// Re-calculate the slices just in time for the network response
		this._syncPaginationData();

		// Queue the UI to be injected into the DOM as soon as the SPA renders the wrapper
		DOMObserver.waitForElement(APP_CONFIG.MATCH_WRAPPER_SELECTOR, (wrapper) => {
			this._renderUI(wrapper);
		});

		// Return the mocked data payload so the XHRInterceptor can feed it to the browser
		return JSON.stringify(this.appState.data.targetPageData);
	}

	/**
	* Delegates DOM rendering to Controllers
	*/
	_renderUI(matchWrapper) {
		const paginator = new PaginationController(matchWrapper, this.appState);
		paginator.inject();

		const liveNode = document.getElementById('dashboard-live-render-node');
		if (liveNode) {
			// Passing the engine here so the controller can call engine.generateAnalytics()
			// dynamically when timeframes or map tabs are clicked.
			const dashboard = new DashboardController(liveNode, this.appState, this.analyticsEngine);
			dashboard.refresh();
		}
	}
}
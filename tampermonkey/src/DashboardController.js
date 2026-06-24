const RECENT_TIMEFRAME_DAYS = Object.freeze({
	'TODAY': 0,
	'24H': 1,
});

const TIMEFRAME_DAYS = Object.freeze({
	...RECENT_TIMEFRAME_DAYS,
	'7D': 7,
	'14D': 14,
	'30D': 30, // Default
	'YEAR': 365,
	'ALL TIME': 0,
});

const KEYS_RECENT_TIMEFRAME_DAYS = Object.freeze(
	Object.keys(RECENT_TIMEFRAME_DAYS)
);

const KEYS_TIMEFRAME_DAYS = Object.freeze(
	Object.keys(TIMEFRAME_DAYS)
);

const DashboardViews = {
	Header: (stats, activeTimeframe, isExpanded) => `
		<header class="flex items-center justify-between gap-4 bg-surface-black/20 px-4 py-2 border-b border-primary-smoke-10/10 cursor-pointer select-none" id="dashboard-main-toggle">
			<div class="flex items-center gap-3">
				<svg id="dash-main-arrow" class="size-4 text-neutral-text-medium transition-transform duration-200 ${!isExpanded ? '-rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>
				<h2 class="font-display text-sm md:text-base text-neutral-text-light font-bold flex items-center gap-2">
					📊 Historical Dashboard
					<span class="text-xs font-normal text-neutral-text-medium">(${stats.totalGamesCount} matches checked)</span>
				</h2>
			</div>
			<div class="flex gap-4">
				<button id="copy-killer-summary-btn" class="tf-tab-btn tf-active">📋 Copy killers faced</button>
				${KEYS_RECENT_TIMEFRAME_DAYS.includes(activeTimeframe) ? `<button id="copy-matches-summary-btn" class="tf-tab-btn tf-active">📋 Copy today's matches</button>` : ''}
			</div>
			<div class="flex bg-surface-black/40 rounded-xs p-0.5 border border-white/5 stop-propagation">
				${KEYS_TIMEFRAME_DAYS.map(tf =>
					`<button data-tf="${tf}" class="tf-tab-btn tf-trigger ${activeTimeframe === tf ? 'tf-active' : ''}">${tf}</button>`
				).join('')}
			</div>
		</header>
	`,

	SurvivorOutcomes: (stats) => {
		const total = stats.escapes + stats.deaths;
		const rate = total > 0 ? ((stats.escapes / total) * 100).toFixed(2) : "0.00";
		return `
			<div class="flex flex-col rounded-sm border border-primary-smoke-10/10 p-4 justify-between h-[120px] premium-survival-gradient">
				<span class="text-xs font-semibold uppercase tracking-wider text-neutral-text-medium border-b border-primary-smoke-10/10 pb-2">Survivor Outcomes</span>
				<div class="flex items-center justify-between mt-auto mb-auto w-full px-1">
					<div class="flex flex-col items-center"><span class="text-2xl font-bold text-green-400 font-mono tracking-tight">${stats.escapes}</span><span class="text-[10px] text-neutral-text-medium mt-1 font-medium">Escapes</span></div>
					<div class="flex flex-col items-center"><span class="text-2xl font-bold text-red-500 font-mono tracking-tight">${stats.deaths}</span><span class="text-[10px] text-neutral-text-medium mt-1 font-medium">Deaths</span></div>
					<div class="flex flex-col border-l border-primary-smoke-10/10 pl-4 items-end"><span class="text-2xl font-bold text-neutral-text-light font-mono tracking-tight">${rate}%</span><span class="text-[10px] text-neutral-text-medium mt-1 font-medium">Survival Rate</span></div>
				</div>
			</div>
		`;
	},

	KillerSectionHeader: (title, toggleId, arrowId, isExpanded) => `
		<header class="flex items-center gap-2 w-full cursor-pointer select-none border-b border-primary-smoke-10/10 pb-2 mb-2" id="${toggleId}-header">
			<div class="flex items-center gap-3">
				<svg id="${arrowId}" class="size-4 text-neutral-text-medium transition-transform duration-200 ${!isExpanded ? '-rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>
				<span class="text-xs font-semibold uppercase tracking-wider text-neutral-text-medium pb-2">${title}</span>
			</div>
		</header>
	`,

	MapSectionHeader: (title, toggleId, activeTab, isExpanded) => `
		<header class="flex items-center justify-between gap-2 w-full cursor-pointer select-none border-b border-primary-smoke-10/10 pb-2 mb-2" id="${toggleId}-header">
			<div class="flex items-center gap-2">
				<svg id="unified-maps-arrow" class="size-4 text-neutral-text-medium transition-transform duration-200 ${!isExpanded ? '-rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>
				<span class="text-xs font-semibold uppercase tracking-wider text-neutral-text-medium pb-2">${title}</span>
			</div>
			<div role="group" class="flex items-center rounded-sm bg-black/32 p-0.5 custom-mini-tabs-bar ml-4" id="map-tab-clicks-stop">
				<div class="custom-tooltip-wrapper">
					<button id="btn-map-surv" class="flex flex-col items-center justify-center rounded-xs border mini-action-btn ${activeTab === 'SURVIVOR' ? 'tab-active-surv' : ''}">
						<div class="relative flex items-center justify-center icon-container-root">
							<img alt="survivor-icon" src="https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fsurvivor_icon.26372593.png&amp;w=48&amp;q=75" class="h-4 w-auto">
							${activeTab === 'SURVIVOR' ? '<div class="absolute pointer-events-none flex items-center justify-center custom-fixed-glow-shell"><div class="rounded-full bg-secondary-softlight size-[28%] blur-[10px]"></div></div>' : ''}
						</div>
					</button>
					<div class="custom-tooltip-box">
						<div role="tooltip" class="rounded-md w-max flex flex-col justify-start items-start gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] bg-neutral-text-light px-3 py-0.5 max-w-32 text-center">
							<div class="w-full font-semibold text-xs overflow-hidden text-ellipsis text-neutral-text-xdark">View as Survivor</div>
						</div>
						<div class="tooltip-arrow-pointer">
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" fill="currentColor" viewBox="0 0 12 6" class="rotate-180 text-neutral-text-light"><path d="M0 0h12L6 6Z"></path></svg>
						</div>
					</div>
				</div>

				<div class="custom-tooltip-wrapper">
					<button id="btn-map-kill" class="flex flex-col items-center justify-center rounded-xs border mini-action-btn ${activeTab === 'KILLER' ? 'tab-active-kill' : ''}">
						<div class="relative flex items-center justify-center icon-container-root">
							<img alt="killer-icon" src="https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fkiller_icon.bef694bf.png&amp;w=48&amp;q=75" class="h-4 w-auto">
							${activeTab === 'KILLER' ? '<div class="absolute pointer-events-none flex items-center justify-center custom-fixed-glow-shell"><div class="rounded-full bg-secondary-softlight size-[28%] blur-[10px]"></div></div>' : ''}
						</div>
					</button>
					<div class="custom-tooltip-box">
						<div role="tooltip" class="rounded-md w-max flex flex-col justify-start items-start gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] bg-neutral-text-light px-3 py-0.5 max-w-32 text-center">
							<div class="w-full font-semibold text-xs overflow-hidden text-ellipsis text-neutral-text-xdark">View as Killer</div>
						</div>
						<div class="tooltip-arrow-pointer">
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" fill="currentColor" viewBox="0 0 12 6" class="rotate-180 text-neutral-text-light"><path d="M0 0h12L6 6Z"></path></svg>
						</div>
					</div>
				</div>
			</div>
		</header>
	`,
};

class DashboardController {
	constructor(panelContainer, stateObject, analyticsEngine) {
		this.container = panelContainer;
		this.state = stateObject;
		this.engine = analyticsEngine;
		
		this.tableCompiler = new TableCompiler(
			this.state.data.portraitsCache,
			this.state.data.expandedRows
		);
	}
	
	refresh() {
		// Fetch fresh stats based on current timeframes/roles
		const stats = this.engine.generateAnalytics();
		if (!stats) return;
		
		const killersTableHtml = this.tableCompiler.compile(stats.allKillers, 'killer');
		
		const isMapsTableTargetingSurvivor = this.state.preferences.filters.mapTab === 'SURVIVOR'
		const mapsTableHtml = isMapsTableTargetingSurvivor
			? this.tableCompiler.compile(stats.allSurvMaps, 'surv-map')
			: this.tableCompiler.compile(stats.allKillerMaps, 'killer-map');
		const mapTableGradient = isMapsTableTargetingSurvivor
			? 'from-theme-blue-light/40 to-theme-blue-light/0'
			: 'from-theme-red-light/20 to-theme-red-light/0';
		
		this.container.innerHTML = `
			<section class="flex w-full flex-col gap-4 border border-primary-smoke-10/10 bg-surface-black/10 rounded-sm overflow-hidden transition-all shadow-xl">
				${DashboardViews.Header(stats, this.state.preferences.filters.timeframe, this.state.preferences.ui.dashboardExpanded)}
		
				<div class="p-4 flex flex-col gap-6" id="dash-collapsible-body" style="${this.state.preferences.ui.dashboardExpanded ? '' : 'display: none !important;'}">
					${DashboardViews.SurvivorOutcomes(stats)}
		
					<div class="flex flex-col items-center border-neutral-text-light/10 rounded-lg border border-t-0 lg:border-t gap-4 px-4 pb-10 lg:gap-6 lg:p-6 overflow-clip lg:overflow-visible border-x-0 sm:border-x rounded-none sm:rounded-lg -mx-4 sm:mx-0 bg-surface-dark bg-linear-transition bg-linear-to-b lg:bg-linear-157 from-theme-red-light/20 to-theme-red-light/0 to-80% w-full">
						${DashboardViews.KillerSectionHeader('🔪 Killers Encountered', 'killers-toggle', 'killers-arrow', this.state.preferences.ui.killersExpanded)}
						<div id="killers-collapsible-body" class="w-full flex flex-col" style="${this.state.preferences.ui.killersExpanded ? '' : 'display: none !important;'}">
							<table class="flex flex-col w-full text-neutral-text-xlight max-h-[440px] overflow-y-auto custom-scrollbar-panel rounded-sm border border-primary-smoke-10/10 bg-transparent">
								<thead class="block overflow-auto shrink-0 bg-surface-black/40 border-b border-primary-smoke-10/10 sticky top-0 z-10" style="grid-template-columns: repeat(12, 1fr);">
									<tr class="w-full grid grid-cols-[inherit]">
										<th class="font-medium flex items-center justify-start text-left text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="6" style="grid-column: span 6 / span 6;">Killers</th>
										<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="2" style="grid-column: span 2 / span 2;">Matches Faced</th>
										<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="2" style="grid-column: span 2 / span 2;">Encounter Rate</th>
										<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="2" style="grid-column: span 2 / span 2;">Your Escape Rate</th>
									</tr>
								</thead>
								<tbody class="block h-auto w-full bg-transparent table-stripped" style="grid-template-columns: repeat(12, 1fr);" tabindex="-1">
									${killersTableHtml}
								</tbody>
							</table>
						</div>
					</div>
		
					<div class="flex flex-col items-center border-neutral-text-light/10 rounded-lg border border-t-0 lg:border-t gap-4 px-4 pb-10 lg:gap-6 lg:p-6 overflow-clip lg:overflow-visible border-x-0 sm:border-x rounded-none sm:rounded-lg -mx-4 sm:mx-0 bg-surface-dark bg-linear-transition bg-linear-to-b lg:bg-linear-157 ${mapTableGradient} to-80% w-full">
						${DashboardViews.MapSectionHeader('🗺️ Maps', 'unified-maps-toggle', this.state.preferences.filters.mapTab, this.state.preferences.ui.unifiedMapsExpanded)}
						<div id="unified-maps-collapsible-body" class="w-full flex flex-col" style="${this.state.preferences.ui.unifiedMapsExpanded ? '' : 'display: none !important;'}">
							<table class="flex flex-col w-full text-neutral-text-xlight max-h-[440px] overflow-y-auto custom-scrollbar-panel">
								<thead class="block overflow-auto shrink-0 bg-surface-black/40 border-b border-primary-smoke-10/10 sticky top-0 z-10" style="grid-template-columns: repeat(12, 1fr);">
									<tr class="w-full grid grid-cols-[inherit]">
										<th class="font-medium flex items-center justify-start text-left text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="6" style="grid-column: span 6 / span 6;">Realm Trial Maps</th>
										<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="2" style="grid-column: span 2 / span 2;">Played</th>
										<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="2" style="grid-column: span 2 / span 2;">Rotation Rate</th>
										<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 last:pr-8 py-3" scope="col" colspan="2" style="grid-column: span 2 / span 2;">${isMapsTableTargetingSurvivor ? 'Your Escape Rate' : 'Your Kill Rate'}</th>
									</tr>
								</thead>
								<tbody class="block h-auto w-full bg-transparent table-stripped" style="grid-template-columns: repeat(12, 1fr);" tabindex="-1">
									${mapsTableHtml}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</section>
		`;
		
		this._bindEvents(stats);
		this._bindTableInteractions(stats);
	}
	
	_bindTableInteractions(stats) {
		this.container.querySelectorAll('.custom-grid-row-action').forEach(row => {
			row.addEventListener('click', (e) => {
				const row = e.target.closest('.custom-grid-row-action');
				if (!row) return;
				
				const rowId = row.dataset.rowId;
				
				const wrapper = this.container.querySelector(`#wrapper-${rowId}`);
				const expandButton = row.querySelector('button[title="Expand"]');
				
				if (wrapper) {
					const isHidden = wrapper.classList.contains('grid-rows-[0fr]');
					
					if (isHidden) {
						wrapper.classList.remove('grid-rows-[0fr]', 'opacity-0');
						wrapper.classList.add('grid-rows-[1fr]', 'opacity-100');
						
						if (expandButton) expandButton.classList.remove('-rotate-90');
						this.tableCompiler.expandedDataRows.add(rowId);
					} else {
						wrapper.classList.remove('grid-rows-[1fr]', 'opacity-100');
						wrapper.classList.add('grid-rows-[0fr]', 'opacity-0');
						
						if (expandButton) expandButton.classList.add('-rotate-90');
						this.tableCompiler.expandedDataRows.delete(rowId);
					}
				}
			});
		});
		
		this.container.querySelectorAll('.mini-action-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const newTab = btn.id === 'btn-map-surv' ? 'SURVIVOR' : 'KILLER';
				this.state.preferences.filters.mapTab = newTab;
				localStorage.setItem(STORAGE_KEYS.MAP_TAB, newTab);
				this.refresh();
			});
		});
		
		this.container.querySelectorAll('.custom-view-all-killers-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const mapName = btn.getAttribute('data-map-name');
				const mapData = stats.allKillerMaps.find(m => m.name === mapName);
				
				if (mapData) {
					const killerModal = new MapKillersModal(mapData, this.state.data.portraitsCache);
					killerModal.show();
				}
			});
		});
	}
	
	_bindEvents(stats) {
		this._bindToggleAction('#dashboard-main-toggle', '#dash-collapsible-body', '#dash-main-arrow', 'dashboardExpanded', STORAGE_KEYS.DASH_MAIN_EXP);
		this._bindToggleAction('#killers-toggle-header', '#killers-collapsible-body', '#killers-arrow', 'killersExpanded', STORAGE_KEYS.DASH_KILLERS_EXP);
		this._bindToggleAction('#unified-maps-toggle-header', '#unified-maps-collapsible-body', '#unified-maps-arrow', 'unifiedMapsExpanded', STORAGE_KEYS.DASH_MAPS_EXP);
		
		// Prevent bubbling on controls
		this.container.querySelectorAll('.stop-propagation').forEach(el => {
			el.addEventListener('click', e => e.stopPropagation());
		});
		
		this.container.querySelectorAll('.tf-trigger').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const targetTf = e.target.getAttribute('data-tf');
				localStorage.setItem(STORAGE_KEYS.TIMEFRAME, targetTf);
				this.state.preferences.filters.timeframe = targetTf;
				
				this.engine.state.activeTimeframe = targetTf;
				this.refresh();
			});
		});
		
		this._bindClipboard('#copy-killer-summary-btn', () => ClipboardUtils.buildKillerSummary(stats));
		this._bindClipboard('#copy-matches-summary-btn', () => ClipboardUtils.buildMatchesSummary(stats, this.state.preferences.filters.timeframe));
	}
	
	_bindToggleAction(triggerId, bodyId, arrowId, stateKey, storageKey) {
		const trigger = this.container.querySelector(triggerId);
		if (!trigger) return;
		
		trigger.addEventListener('click', () => {
			this.state.preferences.ui[stateKey] = !this.state.preferences.ui[stateKey];
			localStorage.setItem(storageKey, this.state.preferences.ui[stateKey]);
			
			const body = this.container.querySelector(bodyId);
			const arrow = this.container.querySelector(arrowId);
			
			if (this.state.preferences.ui[stateKey]) {
				body.style.setProperty('display', '', 'important');
				arrow.classList.remove('-rotate-90')
			} else {
				body.style.setProperty('display', 'none', 'important');
				arrow.classList.add('-rotate-90');
			}
		});
	}
	
	_bindClipboard(selector, textGeneratorFn) {
		const btn = this.container.querySelector(selector);
		if (!btn) return;
		
		btn.addEventListener('click', async (e) => {
			e.stopPropagation();
			try {
				await navigator.clipboard.writeText(textGeneratorFn());
				const oldText = btn.innerText;
				btn.innerText = '✅ Copied!';
				setTimeout(() => btn.innerText = oldText, 2000);
			} catch (err) {
				console.error('Clipboard failed', err);
			}
		});
	}
}
const PAGINATION_CONFIG = Object.freeze({
	PAGE_SIZES: [5, 10, 15, 20, 25, 30, 40, 50],
	TABS: [
		{ id: 'btn-tab-all', role: 'ALL', title: 'All Matches', activeClass: 'tab-active-all', icon: 'https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fgeneral_icon.94d670af.png&w=48&q=75' },
		{ id: 'btn-tab-surv', role: 'SURVIVOR', title: 'Survivor Only', activeClass: 'tab-active-surv', icon: 'https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fsurvivor_icon.26372593.png&w=48&q=75' },
		{ id: 'btn-tab-kill', role: 'KILLER', title: 'Killer Only', activeClass: 'tab-active-kill', icon: 'https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fkiller_icon.bef694bf.png&w=48&q=75' }
	]
});

const PaginationViews = {
	FilterTab: ({ id, title, icon, activeClass }, isActive) => `
		<div class="custom-tooltip-wrapper">
			<button id="${id}" class="flex flex-col items-center justify-center rounded-xs border mini-action-btn ${isActive ? activeClass : ''}" type="button">
				<div class="relative flex items-center justify-center icon-container-root">
					<img alt="${title.replace(/\s+/g, '-').toLowerCase()}" src="${icon}" class="h-5 w-auto ${id === 'btn-tab-all' ? 'relative z-1' : ''}">
					${isActive ? '<div class="absolute pointer-events-none flex items-center justify-center custom-fixed-glow-shell"><div class="rounded-full bg-secondary-softlight size-[28%] blur-[10px]"></div></div>' : ''}
				</div>
			</button>
			<div class="custom-tooltip-box">
				<div role="tooltip" class="rounded-md w-max flex flex-col justify-start items-start gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] bg-neutral-text-light px-3 py-0.5 max-w-28 text-center">
					<div class="w-full font-semibold text-xs overflow-hidden text-ellipsis text-neutral-text-xdark">${title}</div>
				</div>
				<div class="tooltip-arrow-pointer">
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" fill="currentColor" viewBox="0 0 12 6" class="rotate-180 text-neutral-text-light"><path d="M0 0h12L6 6Z"></path></svg>
				</div>
			</div>
		</div>
	`,

	Layout: (tabsHtml, optionsHtml, currentPage, totalPages) => `
		<div id="dashboard-live-render-node" class="w-full"></div>
		<div class="custom-toolbar-row">
			<div role="group" class="flex items-center rounded-sm bg-black/32 p-0.5 custom-mini-tabs-bar">
				${tabsHtml}
			</div>
			<div class="custom-pagination-layout">
				<select id="custom-per-page-select" class="custom-page-dropdown" aria-label="Matches per page">
					${optionsHtml}
				</select>
				<span class="ui-divider-pipe">|</span>
				<button id="custom-nav-prev" type="button" ${currentPage <= 1 ? 'disabled' : ''}>◀ Prev</button>
				<span id="custom-page-text-indicator">Page ${currentPage} of ${totalPages}</span>
				<button id="custom-nav-next" type="button" ${currentPage >= totalPages ? 'disabled' : ''}>Next ▶</button>
			</div>
		</div>
	`
};

class PaginationController {
	constructor(matchWrapper, appState) {
		this.wrapper = matchWrapper;
		this.state = appState;
	}

	inject() {
		document.getElementById('custom-paginator-wrapper')?.remove();

		const container = document.createElement('div');
		container.id = 'custom-paginator-wrapper';
		container.className = 'w-full flex flex-col gap-4 mb-6';

		const tabsHtml = PAGINATION_CONFIG.TABS.map(tab =>
			PaginationViews.FilterTab(tab, this.state.preferences.filters.role === tab.role)
		).join('');

		const optionsHtml = PAGINATION_CONFIG.PAGE_SIZES.map(size =>
			`<option value="${size}" ${size === this.state.preferences.itemsPerPage ? 'selected' : ''}>${size} matches</option>`
		).join('');

		container.innerHTML = PaginationViews.Layout(
			tabsHtml,
			optionsHtml,
			this.state.pagination.currentPage,
			this.state.pagination.totalPages
		);

		this.wrapper.insertBefore(container, this.wrapper.firstChild);

		this._bindEvents(container);
		this._triggerDashboardRender(container);
	}

	_bindEvents(container) {
		PAGINATION_CONFIG.TABS.forEach(tab => {
			container.querySelector(`#${tab.id}`).addEventListener('click', () => {
				localStorage.setItem(STORAGE_KEYS.ROLE_FILTER, tab.role);
				this.state.preferences.filters.role = tab.role;
				this._navigate(1);
			});
		});

		container.querySelector('#custom-per-page-select').addEventListener('change', (e) => {
			const newLimit = parseInt(e.target.value, 10);
			localStorage.setItem(STORAGE_KEYS.PAGINATION_LIMIT, newLimit);
			this.state.preferences.itemsPerPage = newLimit;
			this._navigate(this.state.pagination.currentPage);
		});

		// Navigation
		container.querySelector('#custom-nav-prev').addEventListener('click', () => {
			this._navigate(this.state.pagination.currentPage - 1);
		});

		container.querySelector('#custom-nav-next').addEventListener('click', () => {
			this._navigate(this.state.pagination.currentPage + 1);
		});
	}

	_navigate(targetPage) {
		sessionStorage.clear();
		localStorage.removeItem(STORAGE_KEYS.OFFSET);

		const url = new URL(window.location.href);
		url.searchParams.set('page', targetPage);
		window.location.href = url.toString();
	}

	_triggerDashboardRender(container) {
		const liveNode = container.querySelector('#dashboard-live-render-node');
		if (!liveNode) {
			console.warn("[PaginationController] Live render node missing.");
		}
	}
}
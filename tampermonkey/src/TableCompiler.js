const UI_CONFIG = Object.freeze({
	BASE_ASSET_URL: "https://assets.live.bhvraccount.com",
	FALLBACK_KILLER_IMG: "/characters/killers/Chuckles.png",
	FALLBACK_MAP_IMG: "/maps/Ind_CoalTower.png",
	NEXT_JS_SIZES: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
	STATS_BASE_URL: "https://stats.deadbydaylight.com/_next/image",
	ICONS: {
		EXPAND: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24" class="shrink inline-flex justify-center items-center size-5"><path d="m12 13.171 4.95-4.95 1.414 1.415L12 16 5.636 9.636 7.05 8.222z"></path></svg>`,
		VIEW_ALL: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="shrink-0"><path d="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14m0-2a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1"/></svg>`
	}
});

const FormatUtils = {
	getAbsoluteUrl: (rawPath, typeKey) => {
		if (!rawPath) {
			return `${UI_CONFIG.BASE_ASSET_URL}${typeKey === 'killer' ? UI_CONFIG.FALLBACK_KILLER_IMG : UI_CONFIG.FALLBACK_MAP_IMG}`;
		}
		if (rawPath.startsWith('http')) return rawPath;
		return `${UI_CONFIG.BASE_ASSET_URL}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
	},
	
	buildNextJsSrcSet: (absoluteUrl) => {
		const encoded = encodeURIComponent(absoluteUrl);
		return UI_CONFIG.NEXT_JS_SIZES
		.map(w => `/_next/image/?url=${encoded}&amp;w=${w}&amp;q=75 ${w}w`)
		.join(', ');
	},
	
	calculateRates: (item, typeKey) => {
		const calcPct = (part, whole) => whole > 0 ? ((part / whole) * 100).toFixed(2) : "0.00";
		
		if (typeKey === 'killer-map') {
			const total = (item.kills || 0) + (item.escapes || 0);
			return { killRate: calcPct(item.kills || 0, total) };
		}
		
		const total = (item.escapes || 0) + (item.deaths || 0);
		return {
			escapeRate: calcPct(item.escapes || 0, total),
			deathRate: calcPct(item.deaths || 0, total)
		};
	}
};

const UIComponents = {
	StatCard: (title, valueClass, value, subtext = '', borderClass, extraWrapperClasses = '') => `
		<div class="bg-linear-261 from-surface-dark to-surface-medium border-l-2 ${borderClass} rounded-sm p-3 flex flex-col justify-center ${extraWrapperClasses}">
			<span class="text-[10px] uppercase font-bold text-neutral-text-medium tracking-wider">${title}</span>
			<span class="text-sm font-bold ${valueClass} font-mono mt-0.5 truncate">
				${value}
				${subtext ? `<span class="text-xs text-neutral-text-medium font-normal">${subtext}</span>` : ''}
			</span>
		</div>
	`,
	
	ViewAllButton: (mapName) => `
		<button class="custom-view-all-killers-btn mt-3" data-map-name="${mapName}">
			${UI_CONFIG.ICONS.VIEW_ALL}
			<span>View All Killers</span>
		</button>
	`,
	
	Avatar: (item, typeKey, portraitsCache) => {
		if (portraitsCache[item.name]) return portraitsCache[item.name];
		
		const absolutePortrait = FormatUtils.getAbsoluteUrl(item.liveImgPath, typeKey === 'killer' ? 'killer' : 'map');
		const customSrcSet = FormatUtils.buildNextJsSrcSet(absolutePortrait);
		const finalFallbackSrc = `${UI_CONFIG.STATS_BASE_URL}?url=${encodeURIComponent(absolutePortrait)}&amp;w=3840&amp;q=75`;
		
		let html;
		if (typeKey === 'killer') {
			html = `
				<div class="relative aspect-square overflow-hidden rounded-sm size-16 shrink-0">
					<img role="presentation" alt="" loading="lazy" class="size-full bg-cover bg-center bg-no-repeat" src="${UI_CONFIG.STATS_BASE_URL}?url=%2F_next%2Fstatic%2Fmedia%2Fkiller_bg.d3c26be3.png&amp;w=3840&amp;q=90" style="color: transparent;">
					<div class="absolute inset-0 flex items-center justify-center mask-x-from-90% mask-x-to-98% mask-y-from-80% mask-y-to-98%">
						<img alt="${item.name}" title="${item.name}" draggable="false" loading="lazy" class="absolute w-[120%] max-w-none" sizes="77px" srcset="${customSrcSet}" src="${finalFallbackSrc}" style="color: transparent;">
					</div>
				</div>`;
		} else {
			html = `
				<div class="relative aspect-square overflow-hidden rounded-sm size-16 shrink-0">
					<div class="absolute inset-0 flex items-center justify-center">
						<img alt="${item.name}" title="${item.name}" draggable="false" loading="lazy" class="absolute w-[120%] max-w-none" sizes="77px" srcset="${customSrcSet}" src="${finalFallbackSrc}" style="color: transparent;">
					</div>
				</div>`;
		}
		
		portraitsCache[item.name] = html;
		return html;
	}
};

class TableCompiler {
	constructor(portraitsCache, expandedDataRowsSet) {
		this.portraitsCache = portraitsCache;
		this.expandedDataRows = expandedDataRowsSet;
	}
	
	compile(arr, typeKey) {
		if (!arr || !arr.length) {
			return `
				<tr class="w-full grid grid-cols-[inherit] items-center text-center py-8 text-s text-neutral-text-medium/40 italic">
					<td colspan="12" style="grid-column: span 12 / span 12;">No context data discovered for this window</td>
				</tr>
			`;
		}
		
		return arr.map((item, idx) => this._buildRow(item, idx, typeKey)).join('');
	}
	
	_buildRow(item, idx, typeKey) {
		const rowUniqueId = `${typeKey}-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
		const isRowExpanded = this.expandedDataRows.has(rowUniqueId);
		const stripeClass = (idx % 2 === 0) ? 'custom-stripe-dark-even' : 'custom-stripe-dark-odd';
		
		const rates = FormatUtils.calculateRates(item, typeKey);
		const primaryRateDisplay = typeKey === 'killer-map' ? rates.killRate : rates.escapeRate;
		
		return `
			<tr class="w-full grid grid-cols-[inherit] items-center cursor-pointer hover:bg-white/5 text-neutral-text-xlight select-none custom-grid-row-action ${stripeClass}" data-row-id="${rowUniqueId}">
				<th class="font-medium flex items-center justify-start text-left text-display-xxs font-display px-4 last:pr-8 py-2" scope="row" colspan="6" style="grid-column: span 6 / span 6;">
					<div class="flex items-center gap-3">
						<button class="button-plain button-xsmall button-icon group/button bg-radient-parent inline-flex items-center relative overflow-hidden cursor-pointer transition-transform duration-300 shrink-0 size-8 font-display font-medium uppercase text-button-plain bg-button-surface-plain rounded-full ${!isRowExpanded ? '-rotate-90' : ''}" type="button" title="Expand">
							<span class="relative z-1 flex items-center size-full justify-center">
								${UI_CONFIG.ICONS.EXPAND}
							</span>
						</button>
						<span class="text-button-lg w-6 text-center font-mono font-bold text-neutral-text-medium">${idx + 1}</span>
						${UIComponents.Avatar(item, typeKey, this.portraitsCache)}
						<h3 class="text-display-xs font-sans truncate font-medium max-w-[150px]" title="${item.name}">${item.name}</h3>
					</div>
				</th>
				<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 last:pr-8 py-4" colspan="2" style="grid-column: span 2 / span 2;">${item.count}</td>
				<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 last:pr-8 py-4 text-accent-highlight" colspan="2" style="grid-column: span 2 / span 2;">${item.percentage}%</td>
				<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 last:pr-8 py-4" colspan="2" style="grid-column: span 2 / span 2;">${primaryRateDisplay}%</td>
			</tr>
			${this._buildExpandedSubCard(item, typeKey, rates, rowUniqueId, isRowExpanded)}
		`;
	}
	
	_buildExpandedSubCard(item, typeKey, rates, rowUniqueId, isRowExpanded) {
		const cards = [
			UIComponents.StatCard("Matches Logged", "text-neutral-text-xlight", item.count, null, "border-theme-red"),
			UIComponents.StatCard("Distribution Share", "text-purple-400", `${item.percentage}%`, null, "border-purple-500")
		];
		
		if (typeKey === 'killer' || typeKey === 'surv-map') {
			cards.push(
				UIComponents.StatCard("Escaped (Win Metrics)", "text-green-400", item.escapes, `(${rates.escapeRate}%)`, "border-green-500"),
				UIComponents.StatCard("Sacrificed (Loss Metrics)", "text-red-400", item.deaths, `(${rates.deathRate}%)`, "border-red-500")
			);
			if (item.topMapName && typeKey === 'killer') {
				cards.push(UIComponents.StatCard("Most Frequent Map Encounter", "text-yellow-400", item.topMapName, `(${item.topMapCount} matches)`, "border-yellow-500", "col-span-2"));
			}
		} else if (typeKey === 'killer-map') {
			cards.push(
				UIComponents.StatCard("Survivors Sacrificed / Killed", "text-green-400", item.kills, `(${rates.killRate}%)`, "border-green-500"),
				UIComponents.StatCard("Survivors Escaped", "text-red-400", item.escapes, null, "border-red-500"),
				UIComponents.StatCard("Merciless Victories (4K)", "text-yellow-400", item.merciless, null, "border-yellow-500")
			);
			if (item.topKillerName) {
				cards.push(`
					<div class="bg-linear-261 from-surface-dark to-surface-medium border-l-2 border-orange-500 rounded-sm p-3 flex flex-col justify-center">
						<span class="text-[10px] uppercase font-bold text-neutral-text-medium tracking-wider">Most Played Killer On This Map</span>
						<span class="text-sm font-bold text-orange-400 font-mono mt-0.5 truncate">${item.topKillerName} <span class="text-xs text-neutral-text-medium font-normal">(${item.topKillerCount} matches)</span></span>
						${UIComponents.ViewAllButton(item.name)}
					</div>
				`);
			}
		}
			
		return `
			<tr id="subcard-${rowUniqueId}" class="w-full grid grid-cols-[inherit] items-center border-b border-primary-smoke-10/10 bg-surface-black/60 animate-fade-in" style="${isRowExpanded ? '' : 'display: none !important;'}">
				<td colspan="12" class="p-4" style="grid-column: span 12 / span 12;">
					<div class="grid grid-cols-2 gap-3">
						${cards.join('')}
					</div>
				</td>
			</tr>
		`;
	}
}
const UI_CONFIG = Object.freeze({
	BASE_ASSET_URL: "https://assets.live.bhvraccount.com",
	FALLBACK_KILLER_IMG: "/characters/killers/Chuckles.png",
	FALLBACK_MAP_IMG: "/maps/Ind_CoalTower.png",
	NEXT_JS_SIZES: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
	STATS_BASE_URL: "https://stats.deadbydaylight.com/_next/image",
	ICONS: {
		EXPAND: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24" class="shrink inline-flex justify-center items-center size-5"><path d="m12 13.171 4.95-4.95 1.414 1.415L12 16 5.636 9.636 7.05 8.222z"></path></svg>`,
		VIEW_MORE: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 20 20" class="size-5 shrink-0 relative right-0 transition-all duration-300 group-hover/stat-single-card:-right-1"><path d="M10.976 10 6.852 5.877 8.03 4.697l5.303 5.304-5.303 5.303-1.178-1.179z"></path></svg>`,
	},
	STAT_ICONS: {
		ESCAPE: `srcset="/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fescaped.ec883c77.png&amp;w=48&amp;q=75 1x, /_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fescaped.ec883c77.png&amp;w=96&amp;q=75 2x" src="https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fescaped.ec883c77.png&amp;w=96&amp;q=75"`,
		DEATH: `srcset="/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fsacrificed.09e029e8.png&w=48&q=75 1x, /_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fsacrificed.09e029e8.png&w=96&q=75 2x" src="https://stats.deadbydaylight.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fsacrificed.09e029e8.png&w=96&q=75"`,
	},
	STAT_COLORS: {
		KILLER: "border-theme-red",
		SURVIVOR: "border-theme-blue"
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
			return {
				escapeRate: calcPct(item.escapes || 0, total),
				killRate: calcPct(item.kills || 0, total)
			};
		}
		
		const total = (item.escapes || 0) + (item.deaths || 0);
		return {
			escapeRate: calcPct(item.escapes || 0, total),
			deathRate: calcPct(item.deaths || 0, total)
		};
	}
};

const UIComponents = {
	StatCard: (label, value, subvalue, borderColorClass, bottomIcon, buttonSettings) => {
		let card = `
			<div class="flex w-full grow flex-col justify-between px-3 py-2">
				<h4 class="text-md text-neutral-text-light relative flex w-full items-center">
					<span class="w-auto text-left overflow-hidden text-ellipsis">${label}</span>
					${buttonSettings !== undefined ? UI_CONFIG.ICONS.VIEW_MORE : ''}
				</h4>
				<div class="flex grow items-end justify-between mt-1" style="opacity: 1;">
					<span class="grow text-start text-lg font-bold">
						${value}
						${subvalue ? `<span class="text-sm text-neutral-text-medium font-normal ml-1">${subvalue}</span>` : ''}
					</span>
					${!bottomIcon ? '' : `
						<div class="relative inline-flex size-8">
							<img alt="${label}" title="${label}" draggable="false" loading="lazy" width="40" height="40" decoding="async" data-nimg="1" class="relative z-1 aspect-square size-full object-cover overflow-hidden text-[0px]" ${bottomIcon} style="color: transparent;">	
						</div>
					`}
				</div>
			</div>
		`;
		
		const cardDivClass = `group/card relative flex size-full text-neutral-text-light group/stat-single-card justify-between gap-2 min-w-45 rounded-sm p-0 from-surface-dark to-surface-medium bg-linear-261 from-0% to-100% border-l-4 ${borderColorClass} grow md:basis-0`;
		if (buttonSettings !== undefined) {
			card = `
				<button class="${buttonSettings.className} z-1 cursor-pointer focus-visible:-outline-offset-2 ${cardDivClass}" type="button" title="${label}" ${buttonSettings.extraFields}>
					<div class="absolute inset-0 -z-1 rounded-sm from-surface-medium to-surface-dark bg-linear-to-l opacity-0 transition-opacity duration-300 group-hover/stat-single-card:opacity-100"></div>
					${card}
				</button>
			`;
		} else {
			card = `
				<div class="${cardDivClass}">
					${card}
				</div>
			`;
		}
		
		return card;
	},
	
	Avatar: (item, typeKey, portraitsCache) => {
		if (portraitsCache[item.name]) return portraitsCache[item.name];
		
		const absolutePortrait = FormatUtils.getAbsoluteUrl(item.liveImgPath, typeKey === 'killer' ? 'killer' : 'map');
		const customSrcSet = FormatUtils.buildNextJsSrcSet(absolutePortrait);
		const finalFallbackSrc = `${UI_CONFIG.STATS_BASE_URL}?url=${encodeURIComponent(absolutePortrait)}&amp;w=3840&amp;q=75`;
		
		let html;
		if (typeKey === 'killer') {
			html = `
				<div class="relative aspect-square overflow-hidden rounded-sm size-16">
					<img role="presentation" alt="" loading="lazy" width="64" height="64" decoding="async" data-nimg="1" class="size-full bg-cover bg-center bg-no-repeat" sizes="64px" src="${UI_CONFIG.STATS_BASE_URL}?url=%2F_next%2Fstatic%2Fmedia%2Fkiller_bg.d3c26be3.png&w=3840&q=90" style="color: transparent;">
					<div class="absolute inset-0 flex items-center justify-center mask-x-from-90% mask-x-to-98% mask-y-from-80% mask-y-to-98%">
						<img alt="${item.name}" title="${item.name}" draggable="false" loading="lazy" width="77" height="77" decoding="async" data-nimg="1" class="absolute w-[120%] max-w-none" sizes="77px" srcset="${customSrcSet}" src="${finalFallbackSrc}" style="color: transparent;">
					</div>
				</div>
			`;
		} else {
			html = `
				<div class="relative aspect-square overflow-hidden rounded-sm size-16">
					<div class="absolute inset-0 flex items-center justify-center">
						<img alt="${item.name}" title="${item.name}" draggable="false" loading="lazy" class="absolute w-[120%] max-w-none" sizes="77px" srcset="${customSrcSet}" src="${finalFallbackSrc}" style="color: transparent;">
					</div>
				</div>
			`;
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
		const stripeClasses = "nth-[4n+1]:[tbody.table-stripped_&]:bg-surface-black/20 nth-[4n+2]:[tbody.table-stripped_&]:bg-surface-black/20";
		
		const rates = FormatUtils.calculateRates(item, typeKey);
		const primaryRateDisplay = typeKey === 'killer-map' ? rates.killRate : rates.escapeRate;
		
		return `
			<tr class="w-full grid grid-cols-[inherit] items-center cursor-pointer hover:bg-white/5 select-none custom-grid-row-action ${stripeClasses}" data-row-id="${rowUniqueId}">
				<th class="font-medium flex items-center justify-start text-left text-display-xxs font-display px-4 last:pr-8 py-2" scope="row" colspan="6" style="grid-column: span 6 / span 6;">
					<div class="flex items-center gap-3">
						<button class="button-plain button-xsmall button-icon ${!isRowExpanded ? '-rotate-90' : ''} group/button bg-radient-parent inline-flex items-center relative overflow-hidden cursor-pointer transition-all duration-300 shrink-0 hover:shadow-none size-8 font-display font-medium uppercase text-button-plain hover:text-button-plain-hover bg-button-surface-plain hover:bg-button-surface-plain-hover focus-visible:outline-dotted focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:transition-none focus-visible:shadow-(--shadow-focus) disabled:opacity-30 disabled:cursor-not-allowed disabled:data-loading:opacity-100 disabled:data-loading:cursor-wait disabled:data-loading:*:opacity-50 hover:disabled:text-button-plain hover:disabled:bg-button-surface-plain" type="button" title="Expand">
							<span class="relative z-1 flex items-center size-full pointer-events-none justify-center">
								${UI_CONFIG.ICONS.EXPAND}
							</span>
							<span class="bg-follow-plain bg-follow bg-follow-icon"></span>
						</button>
						<span class="text-button-lg w-6 text-center">${idx + 1}</span>
						${UIComponents.Avatar(item, typeKey, this.portraitsCache)}
						<h3 class="text-display-xs font-sans truncate font-medium max-w-[150px]" title="${item.name}">${item.name}</h3>
					</div>
				</th>
				<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 last:pr-8 py-4" colspan="2" style="grid-column: span 2 / span 2;">${item.count}</td>
				<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 last:pr-8 py-4" colspan="2" style="grid-column: span 2 / span 2;">${item.percentage}%</td>
				<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 last:pr-8 py-4" colspan="2" style="grid-column: span 2 / span 2;">${primaryRateDisplay}%</td>
			</tr>
			${this._buildExpandedSubCard(item, typeKey, rates, rowUniqueId, isRowExpanded, stripeClasses)}
		`;
	}
	
	_buildExpandedSubCard(item, typeKey, rates, rowUniqueId, isRowExpanded, stripeClasses, cardsPerRow = 4) {
		const cards = [];
		
		if (typeKey === 'killer') {
			cards.push(
				UIComponents.StatCard("Faced", item.count, `(${item.percentage}%)`, UI_CONFIG.STAT_COLORS.KILLER),
				UIComponents.StatCard("Sacrificed", item.deaths, `(${rates.deathRate}%)`, UI_CONFIG.STAT_COLORS.KILLER, UI_CONFIG.STAT_ICONS.DEATH),
				UIComponents.StatCard("Escaped", item.escapes, `(${rates.escapeRate}%)`, UI_CONFIG.STAT_COLORS.SURVIVOR, UI_CONFIG.STAT_ICONS.ESCAPE),
				UIComponents.StatCard("Most Frequent Map", item.topMapName, `(${item.topMapCount} matches)`, UI_CONFIG.STAT_COLORS.KILLER)
			);
		} else if (typeKey === 'surv-map') {
			cards.push(
				UIComponents.StatCard("Played", item.count, `(${item.percentage}%)`, UI_CONFIG.STAT_COLORS.SURVIVOR),
				UIComponents.StatCard("Died", item.deaths, `(${rates.deathRate}%)`, UI_CONFIG.STAT_COLORS.KILLER, UI_CONFIG.STAT_ICONS.DEATH),
				UIComponents.StatCard("Escaped", item.escapes, `(${rates.escapeRate}%)`, UI_CONFIG.STAT_COLORS.SURVIVOR, UI_CONFIG.STAT_ICONS.ESCAPE),
			);
		} else if (typeKey === 'killer-map') {
			cards.push(
				UIComponents.StatCard("Played", item.count, `(${item.percentage}%)`, UI_CONFIG.STAT_COLORS.KILLER),
				UIComponents.StatCard("Survivors Sacrificed", item.kills, `(${rates.killRate}%)`, UI_CONFIG.STAT_COLORS.KILLER, UI_CONFIG.STAT_ICONS.DEATH),
				UIComponents.StatCard("Survivors Escaped", item.escapes, `(${rates.escapeRate}%)`, UI_CONFIG.STAT_COLORS.SURVIVOR, UI_CONFIG.STAT_ICONS.ESCAPE),
				UIComponents.StatCard("Merciless Victories (4K)", item.merciless, null, UI_CONFIG.STAT_COLORS.KILLER, UI_CONFIG.STAT_ICONS.DEATH),
				UIComponents.StatCard("Most Frequent Killers", item.topKillerName, `(${item.topKillerCount} matches)`, UI_CONFIG.STAT_COLORS.KILLER, undefined, {
					className: 'custom-view-all-killers-btn',
					extraFields: `data-map-name="${item.name}"`
				})
			);
		}
		
		return `
			<tr id="subcard-${rowUniqueId}" class="w-full grid grid-cols-[inherit] ${stripeClasses}">
				<td class="font-medium flex items-center justify-start text-left p-0" colspan="12" style="grid-column: span 12 / span 12;">
					<div id="wrapper-${rowUniqueId}" class="w-full grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isRowExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}">
						<div class="overflow-hidden w-full">
							<div class="grid grow gap-4 w-full p-4 border-b border-primary-smoke-10/10 bg-surface-black/60" style="grid-template-columns: repeat(${cardsPerRow}, 1fr)">
								${cards.join('')}
							</div>
						</div>
					</div>
				</td>
			</tr>
		`;
	}
}
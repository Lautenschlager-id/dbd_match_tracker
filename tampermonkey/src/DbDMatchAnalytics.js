const DBD_ROLES = Object.freeze({
	SURVIVOR: 'VE_Camper',
	KILLER: 'VE_Slasher'
});

const MATCH_OUTCOMES = Object.freeze({
	ESCAPES: new Set(['VE_Escaped', 'VE_SurrenderDraw']),
	DEATHS: new Set(['VE_Sacrificed', 'VE_Killed', 'VE_SurrenderLoss', 'VE_ManuallyLeftMatch'])
});

const MatchUtils = {
	isEscape: (status) => MATCH_OUTCOMES.ESCAPES.has(status),
	isDeath: (status) => MATCH_OUTCOMES.DEATHS.has(status),

	extractEntityName: (entityData) => {
		if (!entityData) return fallback;
		return entityData.name || entityData.id || "???";
	},

	calculateTimeCutoff: (latestTime, timeframe) => {
		if (timeframe === 'TODAY') {
			const date = new Date(latestTime * 1000);
			date.setHours(0, 0, 0, 0);
			return Math.floor(date.getTime() / 1000);
		}
		if (timeframe === 'ALL TIME') return;

		const days = TIMEFRAME_DAYS[timeframe] || TIMEFRAME_DAYS['30D'];
		return latestTime - (days * 24 * 60 * 60);
	}
};

class DbDMatchAnalytics {
	constructor(rawJsonText, stateConfig = {}) {
		this.masterList = this._parseAndFilterData(rawJsonText);

		this.state = {
			activeRole: stateConfig.activeRole || 'ALL',
			activeTimeframe: stateConfig.activeTimeframe || 'MONTH',
			currentPage: stateConfig.currentPage || 1,
			itemsPerPage: stateConfig.itemsPerPage || 30
		};
	}

	_parseAndFilterData(rawText, isString = true) {
		if (!rawText) return [];
		try {
			const parsed = isString ? JSON.parse(rawText) : rawText;
			const filtered = parsed
				.filter(match => match?.matchStat?.isCustomMatch === false && match?.matchStat?.matchDuration > 0)
				.sort((a, b) => (b.matchStat?.matchStartTime || 0) - (a.matchStat?.matchStartTime || 0));

			console.log(`Filter complete: ${filtered.length} total matches, ${parsed.length - filtered.length} filtered out.`);

			return filtered;
		} catch (err) {
			console.error("[AnalyticsEngine] JSON Parsing Error:", err);
			return [];
		}
	}

	getPaginationSlices() {
		let filteredList = this.masterList;

		if (this.state.activeRole === 'SURVIVOR') {
			filteredList = this.masterList.filter(m => m?.playerStat?.playerRole === DBD_ROLES.SURVIVOR);
		} else if (this.state.activeRole === 'KILLER') {
			filteredList = this.masterList.filter(m => m?.playerStat?.playerRole === DBD_ROLES.KILLER);
		}

		const totalPages = Math.ceil(filteredList.length / this.state.itemsPerPage) || 1;
		const startIdx = (this.state.currentPage - 1) * this.state.itemsPerPage;

		return {
			totalPages,
			targetPageData: filteredList.slice(startIdx, startIdx + this.state.itemsPerPage)
		};
	}

	generateAnalytics() {
		if (!this.masterList.length) return null;

		const timestamps = this.masterList.map(m => m?.matchStat?.matchStartTime).filter(t => t > 0);
		if (!timestamps.length) return null;

		const targetCutoff = MatchUtils.calculateTimeCutoff(Math.max(...timestamps), this.state.activeTimeframe);
		const targetedGames = targetCutoff
			? this.masterList.filter(m => (m?.matchStat?.matchStartTime || 0) >= targetCutoff)
			: this.masterList;

		const stats = {
			escapes: 0, deaths: 0,
			totalKillerEncounters: 0, totalSurvGames: 0, totalKillerGames: 0,
			killerRegistry: {}, survMapRegistry: {}, killerMapRegistry: {},
			targetedGames
		};

		targetedGames.forEach(match => this._processMatch(match, stats));

		return this._formatFinalReport(targetedGames.length, stats);
	}

	/**
	* Merges the local history array with the live endpoint data array
	*/
	mergeHistory(localData, liveData) {
		if (!(Array.isArray(localData) && Array.isArray(liveData))) return;

		const indexedHistoryMap = new Map();

		localData.forEach(m => {
			if (m?.matchStat?.matchStartTime) {
				indexedHistoryMap.set(m.matchStat.matchStartTime, m);
			}
		});

		const previousLength = indexedHistoryMap.size;

		liveData.forEach(m => {
			if (m?.matchStat?.matchStartTime) {
				indexedHistoryMap.set(m.matchStat.matchStartTime, m);
			}
		});

		const sortedMatches = Array.from(indexedHistoryMap.values())
			.sort((a, b) => a.matchStat.matchStartTime - b.matchStat.matchStartTime);

		const newLength = sortedMatches.length;
		const addedMatches = newLength - previousLength;

		if (sortedMatches.length < previousLength || addedMatches < 0) {
			console.error(
				`Merge Safety Check Failed! Aborting merge and using local data only.\n` +
				`\tPrevious length: ${previousLength}\n` +
				`\tAttempted new length: ${newLength}\n` +
				`\tRecords added: ${addedMatches}`
			);
			return;
		}

		console.log(`History sync complete: ${newLength} total matches. [+${addedMatches} added]`);

		this.masterList = this._parseAndFilterData(sortedMatches, false);
		return this.masterList;
	}

	_processMatch(match, stats) {
		const role = match?.playerStat?.playerRole;
		const mapName = MatchUtils.extractEntityName(match?.matchStat?.map);
		if (!mapName) return;

		if (role === DBD_ROLES.SURVIVOR) {
			this._processSurvivorMatch(match, mapName, stats);
		} else if (role === DBD_ROLES.KILLER) {
			this._processKillerMatch(match, mapName, stats);
		}

		this._processOpponents(match, mapName, stats);
	}

	_processSurvivorMatch(match, mapName, stats) {
		stats.totalSurvGames++;
		const status = match?.playerStat?.playerStatus?.id;

		if (!stats.survMapRegistry[mapName]) {
			stats.survMapRegistry[mapName] = { count: 0, escapes: 0, deaths: 0, liveImgPath: match.matchStat?.map?.image?.path };
		}

		const mapReg = stats.survMapRegistry[mapName];
		mapReg.count++;

		if (MatchUtils.isEscape(status)) {
			stats.escapes++;
			mapReg.escapes++;
		} else if (MatchUtils.isDeath(status)) {
			stats.deaths++;
			mapReg.deaths++;
		}
	}

	_processKillerMatch(match, mapName, stats) {
		stats.totalKillerGames++;

		if (!stats.killerMapRegistry[mapName]) {
			stats.killerMapRegistry[mapName] = { count: 0, liveImgPath: match.matchStat?.map?.image?.path, killerFreq: {}, kills: 0, escapes: 0, merciless: 0 };
		}

		const mapReg = stats.killerMapRegistry[mapName];
		mapReg.count++;

		if (match?.playerStat?.killerMatchStatus === "MERCILESS KILLER") {
			mapReg.merciless++;
		}

		const killerName = MatchUtils.extractEntityName(match?.playerStat?.characterName);
		if (!mapReg.killerFreq[killerName]) {
			mapReg.killerFreq[killerName] = { count: 1, liveImgPath: match?.playerStat?.characterName.image.path };
		} else {
			mapReg.killerFreq[killerName].count++;
		}

		(match?.opponentStat || []).forEach(opp => {
			const oppStatus = opp?.playerStatus?.id;
			if (MatchUtils.isEscape(oppStatus)) mapReg.escapes++;
			else if (MatchUtils.isDeath(oppStatus)) mapReg.kills++;
		});
	}

	_processOpponents(match, mapName, stats) {
		(match?.opponentStat || []).forEach(opp => {
			if (opp?.playerRole !== DBD_ROLES.KILLER) return;

			const name = MatchUtils.extractEntityName(opp?.characterName);
			const portraitPath = opp?.characterName?.image?.path || "";

			if (!stats.killerRegistry[name]) {
				stats.killerRegistry[name] = { count: 0, escapes: 0, deaths: 0, liveImgPath: portraitPath, mapFreq: {} };
			}

			const kReg = stats.killerRegistry[name];
			kReg.count++;
			stats.totalKillerEncounters++;
			kReg.mapFreq[mapName] = (kReg.mapFreq[mapName] || 0) + 1;

			if (!kReg.liveImgPath && portraitPath) kReg.liveImgPath = portraitPath;

			if (match?.playerStat?.playerRole === DBD_ROLES.SURVIVOR) {
				const status = match?.playerStat?.playerStatus?.id;
				if (MatchUtils.isEscape(status)) kReg.escapes++;
				if (MatchUtils.isDeath(status)) kReg.deaths++;
			}
		});
	}

	_formatFinalReport(totalGamesCount, stats) {
		const calcPercent = (part, whole) => whole > 0 ? ((part / whole) * 100).toFixed(2) : "0.00";

		const allKillers = Object.entries(stats.killerRegistry).map(([name, obj]) => {
			const topMap = Object.entries(obj.mapFreq).sort((a, b) => b[1] - a[1])[0];
			return {
				name, ...obj,
				topMapName: topMap?.[0] || null,
				topMapCount: topMap?.[1] || 0,
				percentage: calcPercent(obj.count, stats.totalKillerEncounters)
			};
		}).sort((a, b) => b.count - a.count);

		const allSurvMaps = Object.entries(stats.survMapRegistry).map(([name, obj]) => ({
			name, ...obj,
			percentage: calcPercent(obj.count, stats.totalSurvGames)
		})).sort((a, b) => b.count - a.count);

		const allKillerMaps = Object.entries(stats.killerMapRegistry).map(([name, obj]) => {
			const sortedKillers = Object.entries(obj.killerFreq).sort((a, b) => b[1].count - a[1].count);
			return {
				name, ...obj,
				topKillerName: sortedKillers[0]?.[0] || null,
				topKillerCount: sortedKillers[0]?.[1].count || 0,
				killerList: sortedKillers.map(([kName, data]) => ({ name: kName, ...data })),
				percentage: calcPercent(obj.count, stats.totalKillerGames)
			};
		}).sort((a, b) => b.count - a.count);

		return {
			totalGamesCount,
			escapes: stats.escapes,
			deaths: stats.deaths,
			allKillers,
			allSurvMaps,
			allKillerMaps,
			targetedGames: stats.targetedGames
		};
	}
}
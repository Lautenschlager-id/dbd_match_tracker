import fs from 'fs/promises';

import { getEnv } from './env.js';
import { loadTokens } from './tokens.js';

const HISTORY_FILE = 'content/history.json';

// Fetches history from Behavior's backend
export async function fetchMatchHistory(options = {}) {
	const { bhvrBackendDomain, bhvrDomain } = await getEnv();
	const { accessToken } = await loadTokens();

	return await fetch(
		`${bhvrBackendDomain}player-stats/match-history/games/dbd/providers/steam?lang=en&limit=50`,
		{
			...options,
			headers: {
				'accept': 'application/json, text/plain, */*',
				'accept-language': 'en-US,en;q=0.9',
				'origin': bhvrDomain,
				'referer': bhvrDomain,
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
				...options.headers,
				'authorization': `Bearer ${accessToken}`
			}
		}
	);
}

// Merges new matches into the existing history file
export async function updateHistoryStorage(incomingMatches) {
	if (!Array.isArray(incomingMatches) || incomingMatches.length === 0) return;

	const indexedHistoryMap = new Map();

	// Load existing history and maps matches with matchStartTime as key
	try {
		const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
		JSON.parse(raw).forEach(m => indexedHistoryMap.set(m.matchStat.matchStartTime, m));
	} catch (err) {
		// File doesn't exist yet
	}

	// Add incoming matches
	const previousLength = indexedHistoryMap.size;
	incomingMatches.forEach(m => indexedHistoryMap.set(m.matchStat.matchStartTime, m));

	const sorted = Array.from(indexedHistoryMap.values())
		.sort((a, b) => a.matchStat.matchStartTime - b.matchStat.matchStartTime);

	const newLength = sorted.length;
	const addedMatches = newLength - previousLength;
	if (sorted.length < previousLength || addedMatches < 0)
		throw new Error(console.error(
			`Merge Safety Check Failed! Aborting merge and using local data only.\n` +
			`\tPrevious length: ${previousLength}\n` +
			`\tAttempted new length: ${newLength}\n` +
			`\tRecords added: ${addedMatches}`
		));

	// Save back to file
	await fs.writeFile(HISTORY_FILE, JSON.stringify(sorted, null, 2), 'utf-8');

	console.log(
		`History sync complete: ${newLength} total matches. [+${addedMatches} added]`
	);
}
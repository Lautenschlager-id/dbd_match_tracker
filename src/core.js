import { fetchMatchHistory, updateHistoryStorage } from './history.js';
import { performBrowserAuth } from './auth.js';
import { sleep, clamp } from './utils.js';
import { checkTrackerState, recordPid } from './cyclical.js';
import { getEnv, processCyclically } from './env.js';

async function authenticatedFetch(options) {
	const response = await fetchMatchHistory(options);
	const data = response.ok ? response.json() : [];
	if (response.status !== 401) return data;

	console.warn('Token expired. Re-authenticating...');

	const maxRetries = 3;
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			await performBrowserAuth();
			break;
		} catch (error) {
			console.error(`\tAttempt ${attempt + 1} failed:`, error.message);
			if (attempt === maxRetries - 1) throw new Error("Max retries reached. Auth failed.");
			await sleep(5000);
		}
	}
	return authenticatedFetch(options);
}

async function tick() {
	console.log('Tick: Getting recent history matches');

	const matches = await authenticatedFetch();
	await updateHistoryStorage(matches);
}

export async function start() {
	const { fetchIntervalMinutes } = await getEnv();
	await checkTrackerState();

	console.log('DeeBeeDee Match History Tracker initialized');

	await recordPid();
	await tick();

	if (await processCyclically()) {
		const interval = clamp(fetchIntervalMinutes, 5, 120);
		setInterval(tick, interval * 60 * 1000);
	}
}
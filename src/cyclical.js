import fs from 'fs/promises';

import { processCyclically } from './env.js';

const PID_FILE = 'system/tracker.pid';
const TRACKER_STATE_FILE = 'system/tracker_state.txt';

export async function recordPid() {
	if (!(await processCyclically())) return;
	await fs.writeFile(PID_FILE, process.pid.toString());
}

// Checks that Task Schedulers are correctly setup for the chosen configuration of the tracker
export async function checkTrackerState() {
	try {
		const rawState = await fs.readFile(TRACKER_STATE_FILE, 'utf8');
		const state = rawState.trim().toLowerCase() === 'true';
		const isSetToCyclical = await processCyclically();

		if (isSetToCyclical !== state) {
			throw new Error("Configuration mismatch. Please run 'install.ps1' again.");
		}
	} catch (err) {
		throw new Error(`Run 'install.ps1' again. System state not found or invalid: ${err.message}.`);
	}
}
import fs from 'fs/promises';

const ENV_FILE = 'content/env.json';

let envPromise = null;

async function loadEnv() {
	const raw = await fs.readFile(ENV_FILE, 'utf-8');
	return JSON.parse(raw);
}

export async function getEnv() {
	if (!envPromise) {
		envPromise = loadEnv();
	}
	return envPromise;
}

export async function processCyclically() {
	const { i_might_play_more_than_50_matches_in_a_day } = await getEnv();
	return i_might_play_more_than_50_matches_in_a_day;
}
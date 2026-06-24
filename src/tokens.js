import fs from 'fs/promises';

const TOKENS_FILE = 'content/tokens.json';

export async function loadTokens() {
	let data;
	try {
		data = await fs.readFile(TOKENS_FILE, 'utf-8');
		return JSON.parse(data);
	}
	catch {
		data = saveTokens("", "", false);
	}
	return data;
}

export async function saveTokens(accessToken, refreshToken, _log = true) {
	const data = { accessToken, refreshToken };
	await fs.writeFile(TOKENS_FILE, JSON.stringify(data, null, 2));
	if (_log) console.log('Tokens updated successfully');
	return data;
}
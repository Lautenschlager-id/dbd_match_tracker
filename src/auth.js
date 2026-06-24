import { isLocatorVisible } from './utils.js';
import { getOTP } from './utils.js';
import { getEnv } from './env.js';
import { createBrowserSession } from './browser.js';
import { saveTokens } from './tokens.js';

class Connector {
	async behavior(page, context, credentials) { }
	async sso(page, credentials) { }
}

class ConnectorGoogle extends Connector {
	async behavior(page, context) {
		await page.locator('#register-google').click();
		return await context.waitForEvent('page');
	}

	async sso(page, { username, password, otp }) {
		const nextBtn = page.locator("(//span[normalize-space()='Next'])[1]");
		const passwordField = page.getByLabel('Enter your password');
		const passkeyConfirm = page.getByRole('heading', { name: 'Use your passkey to confirm' });
		const passkeyQR = page.getByRole('heading', { name: 'Passkeys' });
		const tryAnotherWayBtn = page.getByText('Try another way');
		const passwordBtn = page.getByLabel('Enter your password');

		await page.getByLabel('Email or Phone').fill(username);
		await nextBtn.click();

		// Wait at least one of the locators to show up
		await Promise.race([
			passwordField.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { }),
			passkeyConfirm.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { }),
			passkeyQR.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { }),
		]);

		if (await isLocatorVisible(passkeyQR, 2000))
			await page.getByRole('button', { name: 'Cancel' }).click();

		if (await isLocatorVisible(passkeyConfirm, 2000)) {
			await tryAnotherWayBtn.first().click();
			await passwordBtn.first().click();
		}

		await passwordField.waitFor({ state: 'visible', timeout: 8000 });
		await passwordField.fill(password);

		await nextBtn.click();

		await tryAnotherWayBtn.first().click();
		await page.getByText('Get a verification code').first().click();
		await page.getByLabel('Enter code').fill(getOTP(otp));
		await page.getByRole('button', { name: 'Next' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();
	}
}

const supportedConnectionPlatforms = {
	'google': ConnectorGoogle
}

// Gets Playwright connector methods
function getConnector(platform) {
	const connector = supportedConnectionPlatforms[platform];
	if (!connector)
		throw new Error(`The platform '${platform}' is not yet supported and tokens couldn't be retrieved.`);

	return new connector();
}

// Retrieves access and refresh tokens from Behavior's website
async function extractAuthStore(page) {
	await page.waitForFunction(() => localStorage.getItem('auth-store')?.includes('authToken'));
	const raw = await page.evaluate(() => localStorage.getItem('auth-store'));
	const { state } = JSON.parse(raw);
	return {
		accessToken: state.authToken.token,
		refreshToken: state.refreshToken.token
	};
}

// Connects to Behavior's website and retrieves tokens
export async function performBrowserAuth() {
	console.log('Launching authentication flow...');

	const env = await getEnv();
	const credentials = env.credentials;
	const credentialsPlatform = credentials.platform;

	const connector = getConnector(credentialsPlatform);
	const { browser, context, page } = await createBrowserSession();

	try {
		await page.goto(env.bhvrDomain);
		await page.getByRole('button', { name: 'Sign in' }).click();

		const loginPopup = await context.waitForEvent('page');
		await loginPopup.waitForLoadState('networkidle');

		const platformPage = await connector.behavior(loginPopup, context, credentials);
		if (connector.sso) await connector.sso(platformPage, credentials);

		const { accessToken, refreshToken } = await extractAuthStore(page);
		await saveTokens(accessToken, refreshToken);
	} finally {
		await browser.close();
	}
}
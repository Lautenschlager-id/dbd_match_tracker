import { chromium } from 'playwright';

export async function createBrowserSession() {
	const browser = await chromium.launch({
		headless: false,
		args: [
			'--disable-blink-features=AutomationControlled',
			'--no-sandbox',
			'--disable-dev-shm-usage',
			'--disable-infobars',
			'--window-position=0,0',
			'--window-size=1200,800',
			'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
		]
	});

	const context = await browser.newContext({
		viewport: { width: 600, height: 600 }
	});
	const page = await context.newPage();

	return { browser, context, page };
}
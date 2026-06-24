import { start } from './src/core.js';

(async () => {
	try {
		console.log('Initializing system...');
		await start();
	} catch (error) {
		console.error('Fatal error during startup:', error);
		process.exit(1);
	}
})();
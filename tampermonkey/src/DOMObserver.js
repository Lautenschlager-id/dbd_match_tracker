class DOMObserver {
	static waitForElement(selector, callback) {
		const existingElement = document.querySelector(selector);
		if (existingElement) {
			return callback(existingElement);
		}

		const observer = new MutationObserver((mutations, obs) => {
			const element = document.querySelector(selector);
			if (element) {
				obs.disconnect();
				callback(element);
			}
		});

		observer.observe(document.documentElement, { childList: true, subtree: true });
	}
}
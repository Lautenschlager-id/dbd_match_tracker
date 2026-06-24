class XHRInterceptor {
	constructor(targetString, onIntercept) {
		this.targetString = targetString;
		this.onIntercept = onIntercept;
		this.originalOpen = window.XMLHttpRequest.prototype.open;
		this.originalSend = window.XMLHttpRequest.prototype.send;
	}

	enable() {
		const self = this;

		window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
			this._isTarget = typeof url === 'string' && url.includes(self.targetString);

			if (this._isTarget) {
				const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
				return self.originalOpen.apply(this, [method, cacheBustedUrl, ...args]);
			}

			return self.originalOpen.apply(this, [method, url, ...args]);
		};

		window.XMLHttpRequest.prototype.send = function (body) {
			if (this._isTarget) {
				const originalResponseTextGetter = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText').get;
				const originalResponseGetter = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response').get;

				let cachedMergedData = null;

				// Returns the merged data if the request is done, otherwise returns null
				const getInterceptedData = () => {
					if (this.readyState === 4 && this.status === 200) {
						if (cachedMergedData !== null) return cachedMergedData;

						const liveResponse = originalResponseTextGetter.call(this);
						cachedMergedData = self.onIntercept(liveResponse);

						return cachedMergedData;
					}
					return null;
				};

				// Override xhr.responseText
				Object.defineProperty(this, 'responseText', {
					get: () => {
						const intercepted = getInterceptedData();
						return intercepted !== null ? intercepted : originalResponseTextGetter.call(this);
					},
					configurable: true
				});

				// Override xhr.response
				Object.defineProperty(this, 'response', {
					get: () => {
						const intercepted = getInterceptedData();
						return intercepted !== null ? intercepted : originalResponseGetter.call(this);
					},
					configurable: true
				});
			}

			return self.originalSend.apply(this, arguments);
		};
	}

	disable() {
		window.XMLHttpRequest.prototype.open = this.originalOpen;
		window.XMLHttpRequest.prototype.send = this.originalSend;
	}
}
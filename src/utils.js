import crypto from 'crypto';

export function base32ToBytes(encoded) {
	const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	let binary = '';
	for (let i = 0; i < encoded.length; i++) {
		const char = encoded.charAt(i).toUpperCase();
		const pos = BASE32_CHARS.indexOf(char);
		if (pos === -1) {
			throw new Error(`Invalid Base32 character in secret: ${char}`);
		}
		binary += pos.toString(2).padStart(5, '0');
	}

	const bytes = Buffer.alloc(Math.floor(binary.length / 8));
	for (let i = 0; i < bytes.length; i++) {
		const binbyte = binary.slice(i * 8, (i + 1) * 8);
		bytes[i] = parseInt(binbyte, 2);
	}
	return bytes;
}

export function computeHmac(secretKey, counter, algorithm) {
	return crypto.createHmac(algorithm, secretKey).update(counter).digest();
}

export function dynamicTruncate(hmac) {
	const offset = hmac[hmac.length - 1] & 0xf;

	return ((hmac[offset] & 0x7f) << 24)
		| ((hmac[offset + 1] & 0xff) << 16)
		| ((hmac[offset + 2] & 0xff) << 8)
		| (hmac[offset + 3] & 0xff);
}

// Get a OTP from its secret key
export function getOTP(
	secretKey,
	timestamp = Date.now(),
	algorithm = 'sha1',
	digits = 6,
	interval = 30,
) {
	const formattedSecretKey = secretKey.replace(/\s+/g, '');
	const secret = base32ToBytes(formattedSecretKey);

	const counter = Math.floor(timestamp / 1000 / interval);

	const paddedCounter = Buffer.alloc(8);
	paddedCounter.writeUInt32BE(counter, 4);

	const hmac = computeHmac(secret, paddedCounter, algorithm);

	const trunc = dynamicTruncate(hmac) % 10 ** digits;
	return trunc.toString().padStart(digits, '0');
}

export async function isLocatorVisible(locator, timeout = 5000) {
	try {
		await locator.waitFor({ state: 'visible', timeout });
		return true;
	} catch {
		return false;
	}
}

export async function sleep(msTime) {
	return new Promise(resolve => setTimeout(resolve, msTime));
}

export function clamp(num, min, max){
	return Math.min(Math.max(num, min), max);
}
import { NativeModules, Platform } from 'react-native';

const API_PORT = 3000;

const trimTrailingSlash = (url) => url.replace(/\/+$/g, '');

const getDevBundleHost = () => {
	const scriptURL = NativeModules?.SourceCode?.scriptURL;
	if (!scriptURL) return null;

	const match = scriptURL.match(/^[a-zA-Z]+:\/\/([^:/?#]+)/);
	return match ? match[1] : null;
};

const getApiBaseUrl = () => {
	const envBase = process.env.EXPO_PUBLIC_API_BASE_URL;
	if (envBase) return trimTrailingSlash(envBase);

	const bundleHost = getDevBundleHost();
	if (bundleHost && bundleHost !== 'localhost' && bundleHost !== '127.0.0.1') {
		return `http://${bundleHost}:${API_PORT}`;
	}

	if (Platform.OS === 'android') {
		// Android emulator cannot reach host machine via localhost.
		return `http://10.0.2.2:${API_PORT}`;
	}

	return `http://localhost:${API_PORT}`;
};

export const API_BASE_URL = getApiBaseUrl();

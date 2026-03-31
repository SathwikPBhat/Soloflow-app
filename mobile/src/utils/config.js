import { Platform } from 'react-native';

const PROD_API_BASE_URL = 'https://soloflow-backend-deployment.onrender.com';
const DEV_DEFAULT_API_BASE_URL =
	Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_BASE_URL ||
	(__DEV__ ? DEV_DEFAULT_API_BASE_URL : PROD_API_BASE_URL);
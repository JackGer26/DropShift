import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: false,
});

// Basic response error logging
api.interceptors.response.use(
	response => response,
	error => {
		// eslint-disable-next-line no-console
		console.error('API error:', error);
		return Promise.reject(error);
	}
);

export { api };

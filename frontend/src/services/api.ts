import axios from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: false,
});

// Attach JWT token to every request if present
api.interceptors.request.use(config => {
	const token = localStorage.getItem('sd_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Handle expired / invalid tokens — redirect to login
api.interceptors.response.use(
	response => response,
	error => {
		if (error.response?.status === 401 && window.location.pathname !== '/login') {
			localStorage.removeItem('sd_token');
			window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

export { api };

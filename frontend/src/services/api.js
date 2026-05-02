import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 60000,
});

// ✅ CRITICAL: Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Retry logic (handles Render cold start — server spins up after inactivity)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Only retry on network errors or 5xx, max 2 retries
        if (!config || config.__retryCount >= 2) {
            return Promise.reject(error);
        }

        const isNetworkError = !error.response;
        const isServerError = error.response?.status >= 500;

        if (!isNetworkError && !isServerError) {
            return Promise.reject(error);
        }

        config.__retryCount = (config.__retryCount || 0) + 1;

        // Wait 3 seconds before retry (gives Render time to wake up)
        await new Promise(res => setTimeout(res, 3000));

        return api(config);
    }
);

export default api;
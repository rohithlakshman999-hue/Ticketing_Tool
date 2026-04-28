import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 15000,
});

// Retry logic (handles Render cold start)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        if (!config || config.__retryCount >= 2) {
            return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;
        config.__retryCount += 1;

        // Wait before retry (backend wake-up)
        await new Promise(res => setTimeout(res, 3000));

        return api(config);
    }
);

export default api;
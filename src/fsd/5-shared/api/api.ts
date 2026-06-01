import axios from 'axios';

const baseURL = import.meta.env.VITE_API_HOST + '/api/';

const functionsKey = import.meta.env.VITE_FUNCTIONS_KEY;

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        ...(functionsKey ? { 'x-functions-key': functionsKey } : {}),
    },
});

api.interceptors.request.use(function (config) {
    config.headers.set('Authorization', localStorage.getItem('token'));
    return config;
});

export default api;

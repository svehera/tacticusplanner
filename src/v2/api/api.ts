import axios from 'axios';

const baseURL = import.meta.env.VITE_API_HOST + '/api/';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'x-functions-key': import.meta.env.VITE_FUNCTIONS_KEY,
    },
});

api.interceptors.request.use(function (config) {
    config.headers.set('Authorization', localStorage.getItem('token'));
    return config;
});

export default api;

import axios from 'axios';

const baseURL = 'https://dev-tacticus.azurewebsites.net/api/';
// const baseURL = 'https://helloworldseveryn.azurewebsites.net/api/';
// const baseURL = 'http://localhost:7071/api/';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        // 'x-functions-key': 'HCBedLkPMCgfKqOboAhxkW_Q6SOvw4mQg0Ompp690ca0AzFuUXyDKg==',
        'x-functions-key': 'mU8qN58rHNj5X3C8HnDOvDUS_pCUxppQzTGf5I5Js0waAzFuySrrYg==',
    },
});

api.interceptors.request.use(function (config) {
    config.headers.set('Authorization', localStorage.getItem('token'));
    return config;
});

export default api;

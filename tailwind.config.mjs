/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'selector',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'dark-gray': '#232322',
                'dark-navy': '#2b2b2b',
                'soft-sand': '#d6cfc3',
                charcoal: '#272727',
                blue: '#1976d2',
                'white-opacity': 'rgba(255, 255, 255, 0.092)',
            },
        },
    },
    plugins: [],
};

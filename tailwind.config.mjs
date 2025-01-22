/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'selector',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'dark-gray': '#232322',
                'dark-navy': '#11171d',
                'soft-sand': '#d6cfc3',
            },
        },
    },
    plugins: [],
};

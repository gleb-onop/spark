import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {},
    },
    plugins: [
        plugin(({ addVariant }) => {
            addVariant('fullscreen', '&:fullscreen');
            addVariant('webkit-fullscreen', '&:-webkit-full-screen');
        })
    ]
}

// tailwind.config.js
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        screens: {
            xs: '400px',
            sm: '640px',
            tablet: '768px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
        },
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                brand: ['Priestacy', 'serif'],
            },
            borderRadius: {
                '5xl': '2.5rem',
            },
            spacing: {
                'safe-top': 'env(safe-area-inset-top, 0px)',
                'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
                'topbar': '56px',
                'bottombar': '64px',
            },
            zIndex: {
                topbar: '50',
                sidebar: '40',
                bottomnav: '40',
                notice: '65',
                panel: '70',
                modal: '80',
                menu: '90',
            },
            transitionTimingFunction: {
                'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
        },
    },
    plugins: [],
};
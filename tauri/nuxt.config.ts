import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    ssr: false,
    devServer: { host: process.env.TAURI_DEV_HOST || 'localhost' },
    css: ['~/assets/css/tailwind.css'],
    vite: {
        plugins: [tailwindcss()],
        clearScreen: false,
        envPrefix: ['VITE_', 'TAURI_'],
        server: { strictPort: true }
    },
    modules: ['shadcn-nuxt', '@nuxtjs/color-mode'],
    shadcn: {
        prefix: '',
        componentDir: './components/ui'
    },
    colorMode: {
        preference: 'dark',
        classSuffix: ''
    }
});

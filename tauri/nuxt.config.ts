// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    ssr: false,
    devServer: { host: process.env.TAURI_DEV_HOST || 'localhost' },
    vite: {
        clearScreen: false,
        envPrefix: ['VITE_', 'TAURI_'],
        server: { strictPort: true }
    },
    modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxtjs/color-mode'],
    shadcn: {
        /**
         * Prefix for all the imported component
         */
        prefix: '',
        /**
         * Directory that the component lives in.
         * @default "./components/ui"
         */
        componentDir: './components/ui'
    },
    colorMode: {
        preference: 'dark',
        classSuffix: ''
    }
});

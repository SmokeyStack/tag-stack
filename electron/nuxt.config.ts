import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    modules: ['shadcn-nuxt', 'nuxt-electron', '@nuxtjs/color-mode'],
    electron: {
        build: [
            {
                // Main-Process entry file of the Electron App.
                entry: 'electron/main.ts'
            },
            {
                entry: 'electron/preload.ts',
                onstart(args) {
                    // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                    // instead of restarting the entire Electron App.
                    args.reload();
                }
            }
        ],
        disableDefaultOptions: true
    },
    css: ['~/assets/css/tailwind.css'],
    vite: {
        plugins: [tailwindcss()]
    },
    shadcn: {
        prefix: '',
        componentDir: './components/ui'
    },
    colorMode: {
        preference: 'dark',
        classSuffix: ''
    }
});

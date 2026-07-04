import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    css: ['~/assets/css/tailwind.css'],
    devtools: { enabled: true },
    electron: {
        build: [
            {
                // Main-Process entry file of the Electron App.
                entry: 'electron/main.ts'
            },
            {
                entry: 'electron/preload.ts',
                onstart(args) {
                    args.reload();
                }
            }
        ],
        /**
         * Special thanks to @mia-san: https://github.com/caoxiemeihao/nuxt-electron/issues/110#issuecomment-3172476435
         */
        disableDefaultOptions: process.env.NODE_ENV === 'development'
    },
    modules: ['nuxt-electron', 'shadcn-nuxt'],
    shadcn: {
        prefix: '',
        componentDir: '@/components/ui'
    },
    vite: {
        plugins: [tailwindcss()]
    }
});

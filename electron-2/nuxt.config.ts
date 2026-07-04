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
    modules: ['nuxt-electron', 'nuxt-security', 'shadcn-nuxt'],
    // https://nuxt-security.vercel.app/getting-started/configuration
    security: {
        ssg: {
            meta: true,
            hashScripts: true,
            hashStyles: false
        },
        headers: {
            contentSecurityPolicy: {
                'default-src': ["'self'"],
                'script-src': ["'self'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'app-media:', 'data:'],
                'font-src': ["'self'", 'data:'],
                'connect-src': ["'self'"],
                'object-src': ["'none'"],
                'base-uri': ["'none'"],
                'form-action': ["'none'"]
            }
        },
        rateLimiter: false
    },
    shadcn: {
        prefix: '',
        componentDir: '@/components/ui'
    },
    ssr: false,
    vite: {
        plugins: [tailwindcss()]
    },
    $development: { security: { enabled: false } }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Cognitive Passport', short_name: 'Passport', description: 'Self-sovereign identity — Ed25519-signed', theme_color: '#0a0c10', background_color: '#0a0c10', display: 'standalone' } })], build: { target: 'es2022', cssMinify: 'lightningcss' } });
//# sourceMappingURL=vite.config.js.map
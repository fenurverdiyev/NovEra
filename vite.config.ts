import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_ELEVENLABS_API_KEY': JSON.stringify(env.VITE_ELEVENLABS_API_KEY),
        'process.env.VITE_SERPAPI_KEY': JSON.stringify(env.VITE_SERPAPI_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: true, 
        port: 5175, 
        allowedHosts: [
          '.ngrok.io',
          '.ngrok-free.app',
          '.ngrok.app',
          'localhost',
          '127.0.0.1',
          '192.168.100.41',
          '72dceb2359d7.ngrok-free.app'
        ]
      }
    };
});

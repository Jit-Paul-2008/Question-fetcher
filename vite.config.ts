import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const chem1 = process.env.chem1 || env.chem1 || '';
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY || env.TAVILY_API_KEY || '';
  const TRAVILY_API_KEY = process.env.TRAVILY_API_KEY || env.TRAVILY_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
      'process.env.chem1': JSON.stringify(chem1),
      'process.env.TAVILY_API_KEY': JSON.stringify(TAVILY_API_KEY),
      'process.env.TRAVILY_API_KEY': JSON.stringify(TRAVILY_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: false,
    },
  };
});

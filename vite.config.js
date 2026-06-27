import { defineConfig } from 'vite';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables for the API handlers
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api/')) {
            // Parse body
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            await new Promise(resolve => req.on('end', resolve));
            
            if (body && req.headers['content-type']?.includes('application/json')) {
              try { req.body = JSON.parse(body); } catch(e) {}
            } else {
              req.body = body;
            }
            
            // Parse query
            const url = new URL(req.url, `http://${req.headers.host}`);
            req.query = Object.fromEntries(url.searchParams);
            
            // Polyfill res.status and res.json for Vercel-like API
            const originalEnd = res.end.bind(res);
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              originalEnd(JSON.stringify(data));
            };

            const pathname = url.pathname;
            try {
              let handlerPath;
              if (pathname.startsWith('/api/neon/auth/')) {
                const action = pathname.split('/').pop();
                handlerPath = path.resolve(__dirname, 'api', 'neon', 'auth', `${action}.js`);
              } else if (pathname.startsWith('/api/neon/')) {
                const table = pathname.split('/').pop();
                req.query.table = table;
                handlerPath = path.resolve(__dirname, 'api', 'neon', '[table].js');
              } else if (pathname === '/api/send-reset-link') {
                handlerPath = path.resolve(__dirname, 'api', 'send-reset-link.js');
              }

              if (handlerPath && fs.existsSync(handlerPath)) {
                // Use cache buster for hot reloading of API functions
                const handlerUrl = `${pathToFileURL(handlerPath).href}?update=${Date.now()}`;
                const module = await import(handlerUrl);
                const handler = module.default;
                
                return handler(req, res);
              }
            } catch (e) {
              console.error('API Error:', e);
              return res.status(500).json({ error: e.message });
            }
            
            return res.status(404).json({ error: 'API route not found' });
          }
          next();
        });
      }
    }
  ]
});

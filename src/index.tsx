import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Bindings } from './types/database';

// Import routes
import auth from './routes/auth';
import clients from './routes/clients';
import projects from './routes/projects';
import tasks from './routes/tasks';
import events from './routes/events';
import dashboard from './routes/dashboard';
import resources from './routes/resources';
import folders from './routes/folders';
// import documents from './routes/documents'; // Temporalmente deshabilitado - tabla no existe
import leads from './routes/leads';
import ai from './routes/ai';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files - En Cloudflare Pages se sirven automáticamente desde /
app.use('/static/*', serveStatic({ root: './' }));

// Mount API routes
app.route('/api/auth', auth);
app.route('/api/leads', leads);
app.route('/api/clients', clients);
app.route('/api/projects', projects);
app.route('/api/tasks', tasks);
app.route('/api/events', events);
app.route('/api/dashboard', dashboard);
app.route('/api/resources', resources);
app.route('/api/folders', folders);
app.route('/api/ai', ai);
// app.route('/api/documents', documents); // Temporalmente deshabilitado - tabla no existe

// Main app route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Galia Digital - Plataforma de Gestión</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'galia-purple': '#572c83',
                  'galia-teal': '#08a48d',
                  'galia-navy': '#002840',
                  'galia-light': '#F8F7FA',
                }
              }
            }
          }
        </script>
        <style>
          .gradient-bg {
            background: linear-gradient(135deg, #572c83 0%, #08a48d 100%);
          }
          .sidebar-active {
            background: linear-gradient(90deg, rgba(8,164,141,0.15) 0%, transparent 100%);
            border-left: 3px solid #08a48d;
          }
          .hover-teal:hover {
            color: #08a48d !important;
            transform: translateX(4px);
            transition: all 0.3s ease;
          }
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
        <div id="app">
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #572c83 0%, #08a48d 100%);">
                <div style="text-align: center; color: white;">
                    <img src="/galia-octopus.jpg" alt="Galia Digital" style="height: 120px; margin: 0 auto 1rem; display: block; border-radius: 50%; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
                    <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem;">Galia Digital</h1>
                    <p style="font-size: 1.25rem; margin-bottom: 2rem;">Cargando...</p>
                    <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            * {
                box-sizing: border-box;
            }
        </style>
        
        <script src="/static/full-app.js?v=20251206"></script>
        <script src="/static/leads.js?v=20251206"></script>
        <script src="/static/modals.js?v=20251206"></script>
        <script src="/static/detail-views.js?v=20251206"></script>
        <script src="/static/edit-delete.js?v=20251206"></script>
        <script src="/static/resources-folders.js?v=20251206"></script>
        <script src="/static/calendar-views.js?v=20251206"></script>
        <!-- <script src="/static/documents.js"></script> --> <!-- Temporalmente deshabilitado -->
        <script src="/static/resources.js?v=20251206"></script>
        <script src="/static/ai-assistant.js?v=20251206"></script>
        <script src="/static/galia-app.js?v=20251206"></script>
    </body>
    </html>
  `);
});

export default app;

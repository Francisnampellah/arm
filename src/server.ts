import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { StrapiService } from './services/strapi';
import { buildGetMappingsController } from './controllers/mappingsController';
import { buildMarkerAdminController } from './controllers/markerAdminController';
// Prisma removed: all data is served and managed via Strapi

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const STRAPI_URL = process.env.STRAPI_URL || '';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '77c928b21c730befbbc5a6651fa82c98840898527cfbe40271b68a75b4ba4b03c1610c269fd2a2477356c204a0441b7d7986fb1b52dc77aa058eca675389375ef386fb72da573329e2506c7f56aa4f9585696cbc8f01cf159ad7ea4ab336bad6a1bb465dfc38347277d835e47ab8e6a21adb91254cb02b1b520d125d23bd6c3d';
const STRAPI_CONTENT_TYPE = process.env.STRAPI_CONTENT_TYPE || 'marker-mappings';

// Initialize Strapi service if URL is provided
const strapiService = STRAPI_URL ? new StrapiService(STRAPI_URL, STRAPI_API_TOKEN || undefined, STRAPI_CONTENT_TYPE) : null;

// After build, __dirname points to dist; serve project root one level up
const projectRoot = path.resolve(__dirname, '..');
const viewDir = path.join(projectRoot, 'view');

// Serve static files from project root and view directory
app.use(express.static(projectRoot));
app.use(express.static(viewDir));
app.use(express.json());

// Root route serves the view/index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(viewDir, 'index.html'));
});

// API: list active marker mappings
app.get('/api/mappings', buildGetMappingsController(strapiService));

const markerAdminController = buildMarkerAdminController(strapiService);
app.post('/api/admin/markers', markerAdminController.createMarker);
app.put('/api/admin/markers/:markerId', markerAdminController.updateMarker);
app.delete('/api/admin/markers/:markerId', markerAdminController.deleteMarker);

async function start() {
  if (strapiService) {
    // eslint-disable-next-line no-console
    console.log('Using Strapi CMS as content source:', STRAPI_URL);
  } else {
    // eslint-disable-next-line no-console
    console.warn('STRAPI_URL not set; API endpoints that require Strapi will be disabled or return errors.');
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', e);
  process.exit(1);
});



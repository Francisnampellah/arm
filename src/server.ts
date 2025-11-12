import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { seedDatabase } from './seed';
import { OmekaSService } from './services/omekaS';
import { buildGetMappingsController } from './controllers/mappingsController';
import { buildMarkerAdminController } from './controllers/markerAdminController';
import prisma from './lib/prisma';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const OMEKA_S_URL = process.env.OMEKA_S_URL || '';
const OMEKA_S_API_KEY = process.env.OMEKA_S_API_KEY || '';

// Initialize Omeka S service if URL is provided
const omekaService = OMEKA_S_URL ? new OmekaSService(OMEKA_S_URL, OMEKA_S_API_KEY || undefined) : null;

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
app.get('/api/mappings', buildGetMappingsController(omekaService));

const markerAdminController = buildMarkerAdminController(omekaService);
app.post('/api/admin/markers', markerAdminController.createMarker);
app.put('/api/admin/markers/:markerId', markerAdminController.updateMarker);
app.delete('/api/admin/markers/:markerId', markerAdminController.deleteMarker);

async function start() {
  if (omekaService) {
    // eslint-disable-next-line no-console
    console.log('Using Omeka S as content source:', OMEKA_S_URL);
  } else if (DATABASE_URL) {
    await prisma.$connect();
    await seedDatabase();
    // eslint-disable-next-line no-console
    console.log('Using Postgres as content source');
  } else {
    // eslint-disable-next-line no-console
    console.warn('Neither OMEKA_S_URL nor DATABASE_URL set; API will fail to fetch mappings.');
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



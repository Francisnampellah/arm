import path from 'path';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { StrapiService } from './services/strapi';
import { buildGetMappingsController } from './controllers/mappingsController';
import { buildMarkerAdminController } from './controllers/markerAdminController';
import { buildBulkUploadController } from './controllers/bulkUploadController';
// Prisma removed: all data is served and managed via Strapi

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const STRAPI_URL = (process.env.STRAPI_URL || '').trim();
const STRAPI_API_TOKEN = (process.env.STRAPI_API_TOKEN || '').trim();
const STRAPI_CONTENT_TYPE = (process.env.STRAPI_CONTENT_TYPE || 'markers').trim();

// Initialize Strapi service if URL is provided
const strapiService = STRAPI_URL ? new StrapiService(STRAPI_URL, STRAPI_API_TOKEN || undefined, STRAPI_CONTENT_TYPE) : null;

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// After build, __dirname points to dist; serve project root one level up
const projectRoot = path.resolve(__dirname, '..');
const viewDir = path.join(projectRoot, 'view');

// Serve static files from project root and view directory
app.use(express.static(projectRoot));
app.use(express.static(viewDir));
// Serve markers assets from persistent volume if present, otherwise fall back to repo
const markersVolumePath = '/data/markers';
const markersFallback = path.join(projectRoot, 'markers');
if (fs.existsSync(markersVolumePath)) {
  // eslint-disable-next-line no-console
  console.log('Serving markers from volume at', markersVolumePath);
  app.use('/markers', express.static(markersVolumePath));
} else if (fs.existsSync(markersFallback)) {
  // eslint-disable-next-line no-console
  console.log('Serving markers from repo at', markersFallback);
  app.use('/markers', express.static(markersFallback));
} else {
  // eslint-disable-next-line no-console
  console.warn('No markers directory found at', markersVolumePath, 'or', markersFallback);
}
app.use(express.json());

// Root route serves the view/index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(viewDir, 'index.html'));
});

// Registration page
app.get('/register', (_req, res) => {
  res.sendFile(path.join(viewDir, 'register.html'));
});

// Login page
app.get('/login', (_req, res) => {
  res.sendFile(path.join(viewDir, 'login.html'));
});

// Dashboard page
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(viewDir, 'dashboard.html'));
});

// API: list active marker mappings
app.get('/api/mappings', buildGetMappingsController(strapiService));

const markerAdminController = buildMarkerAdminController(strapiService);
app.post('/api/admin/markers', markerAdminController.createMarker);
app.put('/api/admin/markers/:markerId', markerAdminController.updateMarker);
app.delete('/api/admin/markers/:markerId', markerAdminController.deleteMarker);

// Bulk upload endpoint
app.post('/api/admin/markers/bulk', upload.single('csv'), buildBulkUploadController(strapiService));

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
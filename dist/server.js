"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const strapi_1 = require("./services/strapi");
const mappingsController_1 = require("./controllers/mappingsController");
const markerAdminController_1 = require("./controllers/markerAdminController");
// Prisma removed: all data is served and managed via Strapi
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const STRAPI_URL = (process.env.STRAPI_URL || '').trim();
const STRAPI_API_TOKEN = (process.env.STRAPI_API_TOKEN || '').trim();
const STRAPI_CONTENT_TYPE = (process.env.STRAPI_CONTENT_TYPE || 'markers').trim();
// Initialize Strapi service if URL is provided
const strapiService = STRAPI_URL ? new strapi_1.StrapiService(STRAPI_URL, STRAPI_API_TOKEN || undefined, STRAPI_CONTENT_TYPE) : null;
// After build, __dirname points to dist; serve project root one level up
const projectRoot = path_1.default.resolve(__dirname, '..');
const viewDir = path_1.default.join(projectRoot, 'view');
// Serve static files from project root and view directory
app.use(express_1.default.static(projectRoot));
app.use(express_1.default.static(viewDir));
// Serve markers assets from persistent volume if present, otherwise fall back to repo
const markersVolumePath = '/data/markers';
const markersFallback = path_1.default.join(projectRoot, 'markers');
if (fs_1.default.existsSync(markersVolumePath)) {
    // eslint-disable-next-line no-console
    console.log('Serving markers from volume at', markersVolumePath);
    app.use('/markers', express_1.default.static(markersVolumePath));
}
else if (fs_1.default.existsSync(markersFallback)) {
    // eslint-disable-next-line no-console
    console.log('Serving markers from repo at', markersFallback);
    app.use('/markers', express_1.default.static(markersFallback));
}
else {
    // eslint-disable-next-line no-console
    console.warn('No markers directory found at', markersVolumePath, 'or', markersFallback);
}
app.use(express_1.default.json());
// Root route serves the view/index.html
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(viewDir, 'index.html'));
});
// API: list active marker mappings
app.get('/api/mappings', (0, mappingsController_1.buildGetMappingsController)(strapiService));
const markerAdminController = (0, markerAdminController_1.buildMarkerAdminController)(strapiService);
app.post('/api/admin/markers', markerAdminController.createMarker);
app.put('/api/admin/markers/:markerId', markerAdminController.updateMarker);
app.delete('/api/admin/markers/:markerId', markerAdminController.deleteMarker);
async function start() {
    if (strapiService) {
        // eslint-disable-next-line no-console
        console.log('Using Strapi CMS as content source:', STRAPI_URL);
    }
    else {
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

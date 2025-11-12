"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const seed_1 = require("./seed");
const omekaS_1 = require("./services/omekaS");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const OMEKA_S_URL = process.env.OMEKA_S_URL || '';
const OMEKA_S_API_KEY = process.env.OMEKA_S_API_KEY || '';
// Initialize Omeka S service if URL is provided
const omekaService = OMEKA_S_URL ? new omekaS_1.OmekaSService(OMEKA_S_URL, OMEKA_S_API_KEY || undefined) : null;
// After build, __dirname points to dist; serve project root one level up
const projectRoot = path_1.default.resolve(__dirname, '..');
const viewDir = path_1.default.join(projectRoot, 'view');
// Serve static files from project root and view directory
app.use(express_1.default.static(projectRoot));
app.use(express_1.default.static(viewDir));
// Root route serves the view/index.html
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(viewDir, 'index.html'));
});
// API: list active marker mappings
app.get('/api/mappings', async (_req, res) => {
    try {
        let mappings;
        if (omekaService) {
            // Fetch from Omeka S
            const omekaMappings = await omekaService.fetchMarkerMappings();
            mappings = omekaMappings.filter((m) => m.active);
        }
        else {
            // Fetch from Postgres via Prisma
            mappings = await prisma_1.default.markerMapping.findMany({
                where: { active: true },
                select: {
                    markerId: true,
                    qrCodeData: true,
                    objectName: true,
                    modelUrl: true,
                },
            });
        }
        res.json(mappings);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching mappings:', err);
        res.status(500).json({ error: 'Failed to fetch mappings' });
    }
});
async function start() {
    if (omekaService) {
        // eslint-disable-next-line no-console
        console.log('Using Omeka S as content source:', OMEKA_S_URL);
    }
    else if (DATABASE_URL) {
        await prisma_1.default.$connect();
        await (0, seed_1.seedDatabase)();
        // eslint-disable-next-line no-console
        console.log('Using Postgres as content source');
    }
    else {
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

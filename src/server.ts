import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './db';
import { MarkerMapping } from './models/MarkerMapping';
import { seedDatabase } from './seed';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || '';

// After build, __dirname points to dist; serve project root one level up
const projectRoot = path.resolve(__dirname, '..');
const viewDir = path.join(projectRoot, 'view');

// Serve static files from project root and view directory
app.use(express.static(projectRoot));
app.use(express.static(viewDir));

// Root route serves the view/index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(viewDir, 'index.html'));
});

// API: list active marker mappings
app.get('/api/mappings', async (_req, res) => {
  try {
    const mappings = await MarkerMapping.find({ active: true })
      .select('markerId qrCodeData objectName modelUrl -_id')
      .lean();
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

async function start() {
  if (!MONGO_URI) {
    // eslint-disable-next-line no-console
    console.warn('MONGODB_URI not set; API will fail to fetch mappings.');
  } else {
    await connectToDatabase(MONGO_URI);
    await seedDatabase();
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



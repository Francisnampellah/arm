import prisma from './lib/prisma';

const defaultMappings = [
  {
    markerId: 5,
    qrCodeData: 'chair-qr',
    objectName: 'Demo Chair',
    modelUrl: 'assets/models/chair.gltf',
    active: true
  },
  {
    markerId: 12,
    qrCodeData: 'table-qr',
    objectName: 'Demo Table',
    modelUrl: 'assets/models/table.gltf',
    active: true
  }
];

export async function seedDatabase(): Promise<void> {
  if (process.env.SEED_MARKERS === 'false') {
    return;
  }

  const existingCount = await prisma.markerMapping.count();
  if (existingCount > 0) {
    return;
  }

  await prisma.markerMapping.createMany({
    data: defaultMappings,
    skipDuplicates: true,
  });
  // eslint-disable-next-line no-console
  console.log('Seeded default marker mappings');
}



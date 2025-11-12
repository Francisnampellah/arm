"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const prisma_1 = __importDefault(require("./lib/prisma"));
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
async function seedDatabase() {
    if (process.env.SEED_MARKERS === 'false') {
        return;
    }
    const existingCount = await prisma_1.default.markerMapping.count();
    if (existingCount > 0) {
        return;
    }
    await prisma_1.default.markerMapping.createMany({
        data: defaultMappings,
        skipDuplicates: true,
    });
    // eslint-disable-next-line no-console
    console.log('Seeded default marker mappings');
}

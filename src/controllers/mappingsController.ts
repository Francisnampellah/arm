import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { OmekaSService } from '../services/omekaS';

export function buildGetMappingsController(omekaService: OmekaSService | null) {
  return async function getMappings(_req: Request, res: Response): Promise<void> {
    try {
      let mappings;

      if (omekaService) {
        const omekaMappings = await omekaService.fetchMarkerMappings();
        mappings = omekaMappings.filter((m) => m.active);
      } else {
        mappings = await prisma.markerMapping.findMany({
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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching mappings:', error);
      res.status(500).json({ error: 'Failed to fetch mappings' });
    }
  };
}



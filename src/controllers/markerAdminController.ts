import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { OmekaSService } from '../services/omekaS';

function ensureLocalDataSource(omekaService: OmekaSService | null, res: Response): boolean {
  if (omekaService) {
    res.status(400).json({ error: 'Marker management is disabled when Omeka S is configured.' });
    return false;
  }
  return true;
}

function parseMarkerId(param: string, res: Response): number | null {
  const markerId = Number(param);
  if (Number.isNaN(markerId)) {
    res.status(400).json({ error: 'markerId must be a number.' });
    return null;
  }
  return markerId;
}

export function buildMarkerAdminController(omekaService: OmekaSService | null) {
  return {
    createMarker: async (req: Request, res: Response): Promise<void> => {
      if (!ensureLocalDataSource(omekaService, res)) return;

      const { markerId, qrCodeData, objectName, modelUrl, active = true } = req.body ?? {};

      if (
        markerId === undefined ||
        qrCodeData === undefined ||
        objectName === undefined ||
        modelUrl === undefined
      ) {
        res.status(400).json({ error: 'markerId, qrCodeData, objectName, and modelUrl are required.' });
        return;
      }

      const numericMarkerId = Number(markerId);
      if (Number.isNaN(numericMarkerId)) {
        res.status(400).json({ error: 'markerId must be a number.' });
        return;
      }

      try {
        const created = await prisma.markerMapping.create({
          data: {
            markerId: numericMarkerId,
            qrCodeData,
            objectName,
            modelUrl,
            active: Boolean(active),
          },
        });
        res.status(201).json(created);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to create marker mapping:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          res.status(409).json({ error: 'markerId or qrCodeData already exists.' });
          return;
        }
        res.status(500).json({ error: 'Failed to create marker mapping.' });
      }
    },

    updateMarker: async (req: Request, res: Response): Promise<void> => {
      if (!ensureLocalDataSource(omekaService, res)) return;

      const markerId = parseMarkerId(req.params.markerId, res);
      if (markerId === null) return;

      const { qrCodeData, objectName, modelUrl, active } = req.body ?? {};

      const data: {
        qrCodeData?: string;
        objectName?: string;
        modelUrl?: string;
        active?: boolean;
      } = {};

      if (qrCodeData !== undefined) data.qrCodeData = qrCodeData;
      if (objectName !== undefined) data.objectName = objectName;
      if (modelUrl !== undefined) data.modelUrl = modelUrl;
      if (active !== undefined) data.active = Boolean(active);

      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: 'No fields provided to update.' });
        return;
      }

      try {
        const updated = await prisma.markerMapping.update({
          where: { markerId },
          data,
        });
        res.json(updated);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to update marker mapping:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ error: 'Marker mapping not found.' });
          return;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          res.status(409).json({ error: 'markerId or qrCodeData already exists.' });
          return;
        }
        res.status(500).json({ error: 'Failed to update marker mapping.' });
      }
    },

    deleteMarker: async (req: Request, res: Response): Promise<void> => {
      if (!ensureLocalDataSource(omekaService, res)) return;

      const markerId = parseMarkerId(req.params.markerId, res);
      if (markerId === null) return;

      try {
        await prisma.markerMapping.delete({
          where: { markerId },
        });
        res.status(204).send();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete marker mapping:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          res.status(404).json({ error: 'Marker mapping not found.' });
          return;
        }
        res.status(500).json({ error: 'Failed to delete marker mapping.' });
      }
    },
  };
}



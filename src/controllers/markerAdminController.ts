import { Request, Response } from 'express';
import { StrapiService } from '../services/strapi';

function ensureStrapiEnabled(strapiService: StrapiService | null, res: Response): boolean {
  if (!strapiService) {
    res.status(400).json({ error: 'Marker management is disabled. Configure STRAPI_URL to enable management via Strapi.' });
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

export function buildMarkerAdminController(strapiService: StrapiService | null) {
  return {
    createMarker: async (req: Request, res: Response): Promise<void> => {
      if (!ensureStrapiEnabled(strapiService, res)) return;

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
        const created = await strapiService!.createMarker({
          markerId: numericMarkerId,
          qrCodeData,
          objectName,
          modelUrl,
          active: Boolean(active),
        });
        res.status(201).json(created);
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to create marker mapping via Strapi:', error);
        const msg = String(error?.message || error);
        if (msg.includes('409') || msg.includes('unique') || msg.includes('exists')) {
          res.status(409).json({ error: 'markerId or qrCodeData already exists.' });
          return;
        }
        res.status(500).json({ error: 'Failed to create marker mapping.' });
      }
    },

    updateMarker: async (req: Request, res: Response): Promise<void> => {
      if (!ensureStrapiEnabled(strapiService, res)) return;

      const markerId = parseMarkerId(req.params.markerId, res);
      if (markerId === null) return;

      const { qrCodeData, objectName, modelUrl, active } = req.body ?? {};

      const data: Partial<any> = {};
      if (qrCodeData !== undefined) data.qrCodeData = qrCodeData;
      if (objectName !== undefined) data.objectName = objectName;
      if (modelUrl !== undefined) data.modelUrl = modelUrl;
      if (active !== undefined) data.active = Boolean(active);

      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: 'No fields provided to update.' });
        return;
      }

      try {
        const updated = await strapiService!.updateMarkerByMarkerId(markerId, data);
        res.json(updated);
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to update marker mapping via Strapi:', error);
        const msg = String(error?.message || error);
        if (msg === 'not_found') {
          res.status(404).json({ error: 'Marker mapping not found.' });
          return;
        }
        if (msg.includes('409') || msg.includes('unique') || msg.includes('exists')) {
          res.status(409).json({ error: 'markerId or qrCodeData already exists.' });
          return;
        }
        res.status(500).json({ error: 'Failed to update marker mapping.' });
      }
    },

    deleteMarker: async (req: Request, res: Response): Promise<void> => {
      if (!ensureStrapiEnabled(strapiService, res)) return;

      const markerId = parseMarkerId(req.params.markerId, res);
      if (markerId === null) return;

      try {
        await strapiService!.deleteMarkerByMarkerId(markerId);
        res.status(204).send();
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to delete marker mapping via Strapi:', error);
        const msg = String(error?.message || error);
        if (msg === 'not_found') {
          res.status(404).json({ error: 'Marker mapping not found.' });
          return;
        }
        res.status(500).json({ error: 'Failed to delete marker mapping.' });
      }
    },
  };
}



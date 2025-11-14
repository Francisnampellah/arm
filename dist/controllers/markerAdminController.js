"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMarkerAdminController = buildMarkerAdminController;
function ensureStrapiEnabled(strapiService, res) {
    if (!strapiService) {
        res.status(400).json({ error: 'Marker management is disabled. Configure STRAPI_URL to enable management via Strapi.' });
        return false;
    }
    return true;
}
function parseMarkerId(param, res) {
    const markerId = Number(param);
    if (Number.isNaN(markerId)) {
        res.status(400).json({ error: 'markerId must be a number.' });
        return null;
    }
    return markerId;
}
function buildMarkerAdminController(strapiService) {
    return {
        createMarker: async (req, res) => {
            if (!ensureStrapiEnabled(strapiService, res))
                return;
            const { markerId, qrCodeData, objectName, modelUrl, active = true } = req.body ?? {};
            if (markerId === undefined ||
                qrCodeData === undefined ||
                objectName === undefined ||
                modelUrl === undefined) {
                res.status(400).json({ error: 'markerId, qrCodeData, objectName, and modelUrl are required.' });
                return;
            }
            const numericMarkerId = Number(markerId);
            if (Number.isNaN(numericMarkerId)) {
                res.status(400).json({ error: 'markerId must be a number.' });
                return;
            }
            try {
                const created = await strapiService.createMarker({
                    markerId: numericMarkerId,
                    qrCodeData,
                    objectName,
                    modelUrl,
                    active: Boolean(active),
                });
                res.status(201).json(created);
            }
            catch (error) {
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
        updateMarker: async (req, res) => {
            if (!ensureStrapiEnabled(strapiService, res))
                return;
            const markerId = parseMarkerId(req.params.markerId, res);
            if (markerId === null)
                return;
            const { qrCodeData, objectName, modelUrl, active } = req.body ?? {};
            const data = {};
            if (qrCodeData !== undefined)
                data.qrCodeData = qrCodeData;
            if (objectName !== undefined)
                data.objectName = objectName;
            if (modelUrl !== undefined)
                data.modelUrl = modelUrl;
            if (active !== undefined)
                data.active = Boolean(active);
            if (Object.keys(data).length === 0) {
                res.status(400).json({ error: 'No fields provided to update.' });
                return;
            }
            try {
                const updated = await strapiService.updateMarkerByMarkerId(markerId, data);
                res.json(updated);
            }
            catch (error) {
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
        deleteMarker: async (req, res) => {
            if (!ensureStrapiEnabled(strapiService, res))
                return;
            const markerId = parseMarkerId(req.params.markerId, res);
            if (markerId === null)
                return;
            try {
                await strapiService.deleteMarkerByMarkerId(markerId);
                res.status(204).send();
            }
            catch (error) {
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

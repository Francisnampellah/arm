"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGetMappingsController = buildGetMappingsController;
function buildGetMappingsController(strapiService) {
    return async function getMappings(_req, res) {
        try {
            if (!strapiService) {
                res.status(500).json({ error: 'Strapi integration is not configured. Mappings are served from Strapi.' });
                return;
            }
            const strapiMappings = await strapiService.fetchMarkerMappings();
            const mappings = strapiMappings.filter((m) => m.active);
            res.json(mappings);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.log('Strapi fetch error:', error);
            console.error('Error fetching mappings:', error);
            res.status(500).json({ error: 'Failed to fetch mappings' });
        }
    };
}

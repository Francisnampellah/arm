interface OmekaSItem {
  '@id'?: string;
  'o:id'?: number;
  'o:title'?: string;
  'o:resource_class'?: { 'o:id': number; 'o:label': string };
  'o:resource_template'?: { 'o:id': number; 'o:label': string };
  properties?: Record<string, Array<{ type: string; '@value': string; '@id'?: string }>>;
  'o:media'?: Array<{ 'o:id': number; '@id': string }>;
}

interface MarkerMappingFromOmeka {
  markerId: number;
  qrCodeData: string;
  objectName: string;
  modelUrl: string;
  active: boolean;
}

export class OmekaSService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Fetch items from Omeka S API
   * Assumes items have custom properties:
   * - markerId (numeric)
   * - qrCodeData (string)
   * - modelUrl (URL to glTF/GLB)
   * - active (boolean, optional)
   */
  async fetchMarkerMappings(): Promise<MarkerMappingFromOmeka[]> {
    try {
      const url = `${this.baseUrl}/api/items`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Omeka S API error: ${response.status} ${response.statusText}`);
      }

      const items: OmekaSItem[] = await response.json();
      return items.map((item) => this.mapItemToMarkerMapping(item)).filter((m) => m !== null) as MarkerMappingFromOmeka[];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch from Omeka S:', error);
      throw error;
    }
  }

  /**
   * Map Omeka S item to marker mapping structure
   * Adjust property names based on your Omeka S vocabulary
   */
  private mapItemToMarkerMapping(item: OmekaSItem): MarkerMappingFromOmeka | null {
    const props = item.properties || {};
    
    // Extract values from properties (adjust property IDs/names to match your Omeka S setup)
    // Example: using Dublin Core or custom properties
    const getPropertyValue = (propKey: string): string | number | undefined => {
      const prop = props[propKey];
      if (prop && prop.length > 0) {
        return prop[0]['@value'];
      }
      return undefined;
    };

    // Map properties - adjust these keys to match your Omeka S item properties
    const markerId = Number(getPropertyValue('dcterms:identifier') || getPropertyValue('bibo:identifier') || item['o:id'] || 0);
    const qrCodeData = String(getPropertyValue('dcterms:relation') || getPropertyValue('bibo:uri') || `marker-${markerId}`);
    const objectName = String(getPropertyValue('dcterms:title') || item['o:title'] || 'Unnamed Object');
    const modelUrl = this.extractModelUrl(item);
    const active = getPropertyValue('dcterms:available') !== 'false';

    if (!markerId || !modelUrl) {
      return null; // Skip items without required fields
    }

    return {
      markerId,
      qrCodeData,
      objectName,
      modelUrl,
      active,
    };
  }

  /**
   * Extract model URL from Omeka S item media or properties
   */
  private extractModelUrl(item: OmekaSItem): string {
    // Option 1: From media (if you upload glTF files as media)
    if (item['o:media'] && item['o:media'].length > 0) {
      const mediaId = item['o:media'][0]['o:id'];
      return `${this.baseUrl}/api/media/${mediaId}`;
    }

    // Option 2: From property (e.g., dcterms:source or custom property)
    const props = item.properties || {};
    const urlProp = props['dcterms:source'] || props['bibo:uri'] || props['schema:url'];
    if (urlProp && urlProp.length > 0) {
      return urlProp[0]['@value'];
    }

    // Option 3: Fallback to item URL
    if (item['@id']) {
      return item['@id'];
    }

    return '';
  }
}


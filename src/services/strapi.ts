interface StrapiMarkerMapping {
  id?: number;
  documentId?: string;
  markerId: number;
  qrCodeData: string;
  objectName: string;
  modelUrl: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

interface StrapiResponse<T> {
  data: T | T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiDataItem<T> {
  id: number;
  documentId: string;
  attributes: T;
}

export interface MarkerMappingFromStrapi {
  markerId: number;
  qrCodeData: string;
  objectName: string;
  modelUrl: string;
  active: boolean;
}

export class StrapiService {
  private baseUrl: string;
  private apiToken?: string;
  private contentType: string;

  constructor(baseUrl: string, apiToken: string = "77c928b21c730befbbc5a6651fa82c98840898527cfbe40271b68a75b4ba4b03c1610c269fd2a2477356c204a0441b7d7986fb1b52dc77aa058eca675389375ef386fb72da573329e2506c7f56aa4f9585696cbc8f01cf159ad7ea4ab336bad6a1bb465dfc38347277d835e47ab8e6a21adb91254cb02b1b520d125d23bd6c3d", contentType: string = 'marker') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiToken = apiToken;
    this.contentType = contentType;
  }

  /**
   * Create a new marker mapping in Strapi
   */
  async createMarker(mapping: Partial<StrapiMarkerMapping>): Promise<MarkerMappingFromStrapi> {
    const url = `${this.baseUrl}/api/${this.contentType}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiToken) headers['Authorization'] = `Bearer ${this.apiToken}`;

    const body = JSON.stringify({ data: mapping });
    const response = await fetch(url, { method: 'POST', headers, body });
    if (!response.ok) {
      throw new Error(`Strapi create error: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    const item = Array.isArray(result.data) ? result.data[0] : result.data;
    const mapped = this.mapStrapiItemToMarkerMapping(item as any);
    if (!mapped) throw new Error('Created Strapi item missing required fields');
    return mapped;
  }

  /**
   * Find a Strapi item by markerId; returns the raw Strapi data item or null.
   */
  private async findItemByMarkerId(markerId: number): Promise<StrapiDataItem<StrapiMarkerMapping> | null> {
    const url = `${this.baseUrl}/api/${this.contentType}?filters[markerId][$eq]=${encodeURIComponent(
      String(markerId)
    )}&pagination[limit]=1`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiToken) headers['Authorization'] = `Bearer ${this.apiToken}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Strapi find error: ${response.status} ${response.statusText}`);
    }
    const result: StrapiResponse<StrapiDataItem<StrapiMarkerMapping>> = await response.json();
    const dataArray = Array.isArray(result.data) ? result.data : [result.data];
    return dataArray.length > 0 ? (dataArray[0] as StrapiDataItem<StrapiMarkerMapping>) : null;
  }

  /**
   * Update a marker mapping by markerId
   */
  async updateMarkerByMarkerId(markerId: number, data: Partial<StrapiMarkerMapping>): Promise<MarkerMappingFromStrapi> {
    const item = await this.findItemByMarkerId(markerId);
    if (!item) throw new Error('not_found');
    const id = item.id;
    const url = `${this.baseUrl}/api/${this.contentType}/${id}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiToken) headers['Authorization'] = `Bearer ${this.apiToken}`;
    const body = JSON.stringify({ data });
    const response = await fetch(url, { method: 'PUT', headers, body });
    if (!response.ok) {
      throw new Error(`Strapi update error: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    const mapped = this.mapStrapiItemToMarkerMapping(result.data as any);
    if (!mapped) throw new Error('Updated Strapi item missing required fields');
    return mapped;
  }

  /**
   * Delete a marker mapping by markerId
   */
  async deleteMarkerByMarkerId(markerId: number): Promise<void> {
    const item = await this.findItemByMarkerId(markerId);
    if (!item) throw new Error('not_found');
    const id = item.id;
    const url = `${this.baseUrl}/api/${this.contentType}/${id}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiToken) headers['Authorization'] = `Bearer ${this.apiToken}`;
    const response = await fetch(url, { method: 'DELETE', headers });
    if (!response.ok) {
      throw new Error(`Strapi delete error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Fetch marker mappings from Strapi API
   * Assumes a content type called 'marker-mappings' with fields:
   * - markerId (integer)
   * - qrCodeData (string)
   * - objectName (string)
   * - modelUrl (string/url)
   * - active (boolean)
   */
  async fetchMarkerMappings(): Promise<MarkerMappingFromStrapi[]> {
    try {
      const url = `${this.baseUrl}/api/markers?publicationState=live&pagination[limit]=1000`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiToken) {
        headers['Authorization'] = `Bearer ${this.apiToken}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
      }

      const result: StrapiResponse<StrapiDataItem<StrapiMarkerMapping>> = await response.json();
      
      // Handle both single item and array responses
      const dataArray = Array.isArray(result.data) ? result.data : [result.data];
      
      return dataArray
        .map((item) => this.mapStrapiItemToMarkerMapping(item))
        .filter((m) => m !== null) as MarkerMappingFromStrapi[];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch from Strapi:', error);
      throw error;
    }
  }

  /**
   * Map Strapi item to marker mapping structure
   */
  private mapStrapiItemToMarkerMapping(
    item: StrapiDataItem<StrapiMarkerMapping>
  ): MarkerMappingFromStrapi | null {
    // Strapi responses can vary depending on collection config / plugins.
    // Typical shape: { id, attributes: { markerId, qrCodeData, ... } }
    // But sometimes items are returned directly. Be defensive and tolerant.
    const raw = item as any;
    const attrs = (raw && (raw.attributes ?? raw)) as any;

    if (!attrs || typeof attrs !== 'object') {
      // eslint-disable-next-line no-console
      console.warn('Unexpected Strapi item shape, skipping item:', JSON.stringify(raw).slice(0, 500));
      return null;
    }

    // Accept several common key variants and top-level shapes to be robust
    // Try a list of candidate fields that might represent the marker id
    const candidateMarkerId =
      // prefer explicit barcode field (your sample uses `barcode`)
      attrs.barcode ?? attrs.barcode_number ?? attrs.barcodeValue ??
      attrs.markerId ??
      attrs.marker_id ??
      attrs.markerIdValue ??
      attrs.numeral ??
      attrs.numeral_value ??
      attrs.documentId ??
      attrs.document_id ??
      attrs.id ??
      raw.id ??
      null;

    const markerId = candidateMarkerId !== undefined && candidateMarkerId !== null ? candidateMarkerId : null;

    // QR code fallback: try many variants; if none, fallback to `marker-<markerId>` when markerId exists
    const qrCodeData =
      attrs.qrCodeData ?? attrs.qr_code_data ?? attrs.qr ?? attrs.qrcode ??
      (markerId != null ? `marker-${markerId}` : undefined);

    const objectName = attrs.objectName ?? attrs.object_name ?? attrs.name ?? attrs.title ?? 'Unnamed Object';
    const modelUrl = attrs.modelUrl ?? attrs.model_url ?? attrs.url ?? attrs.url3D ?? attrs.url_3d ?? '';
    const active = attrs.active !== undefined ? attrs.active : true;

    // If we couldn't find any reasonable identifier, still include the item
    // by using the Strapi item id as a last-resort markerId (if available).
    // The goal is to avoid returning an empty list when Strapi has data.
    let finalMarkerId: any = markerId;
    if (finalMarkerId === null || finalMarkerId === undefined) {
      if (raw && raw.id !== undefined && raw.id !== null) {
        // eslint-disable-next-line no-console
        console.warn('Marker id missing; using Strapi entry id as markerId for item:', raw.id);
        finalMarkerId = raw.id;
      } else {
        // no usable id at all; warn but continue by skipping numeric conversion
        // eslint-disable-next-line no-console
        console.warn('Strapi item missing any identifier (markerId/numeral/id). Including item with markerId=null:', JSON.stringify(raw).slice(0, 200));
        finalMarkerId = null;
      }
    }

    if (!modelUrl) {
      // eslint-disable-next-line no-console
      console.warn('Strapi item missing modelUrl for markerId:', finalMarkerId);
    }

    return {
      markerId: finalMarkerId !== null ? Number(finalMarkerId) : NaN,
      qrCodeData: qrCodeData !== undefined ? String(qrCodeData) : (finalMarkerId !== null ? `marker-${finalMarkerId}` : ''),
      objectName: String(objectName),
      modelUrl: String(modelUrl),
      active: Boolean(active),
    };
  }
}


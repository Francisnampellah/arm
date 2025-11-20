import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { StrapiService } from '../services/strapi';

interface CSVRow {
  name?: string;
  pattern?: string;
  url3D?: string;
  barcode?: string;
}

interface BulkUploadResult {
  success: Array<{
    row: number;
    data: any;
    markerId?: number;
  }>;
  failed: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

function ensureStrapiEnabled(strapiService: StrapiService | null, res: Response): boolean {
  if (!strapiService) {
    res.status(400).json({ error: 'Marker management is disabled. Configure STRAPI_URL to enable management via Strapi.' });
    return false;
  }
  return true;
}

export function buildBulkUploadController(strapiService: StrapiService | null) {
  return async (req: Request, res: Response): Promise<void> => {
    if (!ensureStrapiEnabled(strapiService, res)) return;

    // Check if file was uploaded
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No CSV file uploaded. Please upload a CSV file with field name "csv".' });
      return;
    }

    // Validate file type
    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      res.status(400).json({ error: 'Invalid file type. Please upload a CSV file.' });
      return;
    }

    try {
      // Remove BOM if present
      let csvContent = file.buffer.toString('utf-8');
      if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
      }
      // Parse CSV file
      const records: CSVRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });

      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json({ error: 'CSV file is empty or invalid. Please ensure it has a header row and at least one data row.' });
        return;
      }

      const results: BulkUploadResult = {
        success: [],
        failed: [],
        summary: {
          total: records.length,
          successful: 0,
          failed: 0,
        },
      };

      // Get Strapi service info and user token ONCE (before the loop for efficiency)
      const baseUrl = (strapiService as any).baseUrl || '';
      const apiToken = (strapiService as any).apiToken;
      const contentType = (strapiService as any).contentType || 'markers';

      // Check if user token is provided (from Authorization header)
      const authHeader = req.headers.authorization;
      const userToken = authHeader?.replace('Bearer ', '').trim();

      // Fetch user ID once if user token is present (to avoid multiple API calls)
      let userId: number | undefined;
      if (userToken) {
        try {
          const userResponse = await fetch(`${baseUrl}/api/users/me`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.id;
          }
        } catch (e) {
          // If fetching user fails, continue without owner
          console.warn('Could not fetch user for owner assignment:', e);
        }
      }

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

        try {
          // Validate required fields
          if (!row.name || !row.url3D) {
            results.failed.push({
              row: rowNumber,
              data: row,
              error: 'Missing required fields: name and url3D are required',
            });
            continue;
          }

          // Parse barcode (pattern number) - optional but used as markerId
          let barcode: number | undefined;
          if (row.barcode) {
            const parsedBarcode = Number(row.barcode);
            if (!Number.isNaN(parsedBarcode)) {
              barcode = parsedBarcode;
            } else {
              results.failed.push({
                row: rowNumber,
                data: row,
                error: `Invalid barcode value: "${row.barcode}". Must be a number.`,
              });
              continue;
            }
          }

          // Build strapiData
          const strapiData: any = {
            name: row.name.trim(),
            url3D: row.url3D.trim(),
          };

          // Add owner if user token was provided and we got the user ID
          if (userId !== undefined) {
            strapiData.owner = {id: userId};
          }

          // Add barcode if provided (this becomes markerId in the mapping)
          if (barcode !== undefined) {
            strapiData.barcode = barcode;
          }

          // Note: pattern is a media field in Strapi, so we can't set it via CSV
          // Users will need to upload the pattern file separately in Strapi admin

          // Create marker via Strapi API directly (since we're using custom field names)
          const url = `${baseUrl}/api/${contentType}`;
          const headers: HeadersInit = { 'Content-Type': 'application/json' };

          // Priority: User token > Admin API token
          if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
          } else if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
          }

          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ data: strapiData }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Strapi API error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const result = await response.json();
          const createdData = result.data;

          results.success.push({
            row: rowNumber,
            data: row,
            markerId: barcode || createdData?.id,
          });
          results.summary.successful++;

        } catch (error: any) {
          const errorMsg = error?.message || String(error);
          results.failed.push({
            row: rowNumber,
            data: row,
            error: errorMsg,
          });
          results.summary.failed++;
        }
      }

      // Return results
      res.status(200).json(results);

    } catch (error: any) {
      console.error('CSV parsing error:', error);
      res.status(500).json({
        error: 'Failed to process CSV file',
        details: error?.message || String(error),
      });
    }
  };
}
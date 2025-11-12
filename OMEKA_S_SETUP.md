# Omeka S Integration Setup

This project supports using Omeka S as a content management system for AR marker mappings. When Omeka S is not configured, data is served from the local Postgres database via Prisma.

## Running Omeka S with Docker Compose

Docker Compose includes optional services for Omeka S and its MariaDB database.

```bash
docker compose up -d --build
```

- Omeka S is available at `http://localhost:8080`
- Default admin credentials (change after setup):
  - Email: `admin@example.com`
  - Password: `changeme`
- The app container points to the bundled Omeka S at `http://omeka:8080` via `OMEKA_S_URL`
- Set `OMEKA_S_API_KEY` if you enable API authentication in Omeka S

To use an external Omeka S instance instead, remove or override the `OMEKA_S_URL` environment variable in `docker-compose.yml`.

## Configuration

Set these environment variables to use Omeka S:

- `OMEKA_S_URL`: Base URL of your Omeka S installation (e.g., `https://your-omeka-s.com`)
- `OMEKA_S_API_KEY`: (Optional) API key for authenticated requests

## Omeka S Item Structure

Each Omeka S item should have the following properties mapped:

### Required Properties

- **markerId** (numeric): The AR.js barcode marker ID (0-255)
  - Use property: `dcterms:identifier` or `bibo:identifier`
  - Or use the Omeka S item ID (`o:id`)

- **modelUrl** (URL): Path to the glTF/GLB 3D model
  - Use property: `dcterms:source`, `bibo:uri`, or `schema:url`
  - Or upload the model as media and it will be auto-detected

### Optional Properties

- **qrCodeData** (string): QR code data string
  - Use property: `dcterms:relation` or `bibo:uri`
  - Defaults to `marker-{markerId}` if not provided

- **objectName** (string): Display name
  - Use property: `dcterms:title`
  - Defaults to item title (`o:title`)

- **active** (boolean): Whether the marker is active
  - Use property: `dcterms:available`
  - Defaults to `true`

## Example Omeka S Item

Create items in Omeka S with:
- Title: "Demo Chair"
- Identifier (dcterms:identifier): `5`
- Source (dcterms:source): `https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Chair/glTF/Chair.gltf`
- Relation (dcterms:relation): `chair-qr-001`

## Customizing Property Mapping

Edit `src/services/omekaS.ts` to adjust which Omeka S properties map to marker fields:

```typescript
const markerId = Number(getPropertyValue('your:custom:property') || ...);
```

## Priority

- If `OMEKA_S_URL` is set, the app uses Omeka S
- Otherwise, it falls back to Postgres (via Prisma)

## Testing

1. Set `OMEKA_S_URL` in your environment
2. Restart the server
3. Check logs: should see "Using Omeka S as content source"
4. Visit `/api/mappings` to see items fetched from Omeka S


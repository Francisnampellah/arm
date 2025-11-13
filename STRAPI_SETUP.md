# Strapi CMS Integration Setup

This project uses Strapi CMS as the single source of truth for AR marker mappings. All reads and writes are performed through Strapi's API; the application no longer stores or manages mappings directly in a local database.

## Running Strapi with Docker Compose

Docker Compose includes optional services for Strapi and its PostgreSQL database.

```bash
docker compose up -d --build
```

- Strapi is available at `http://localhost:1337`
- Default admin panel: `http://localhost:1337/admin`
  - You'll need to create an admin account on first run
- The app container points to the bundled Strapi at `http://strapi:1337` via `STRAPI_URL`
- Set `STRAPI_API_TOKEN` if you enable API authentication in Strapi

To use an external Strapi instance instead, remove or override the `STRAPI_URL` environment variable in `docker-compose.yml`.

## Configuration

Set these environment variables to use Strapi:

- `STRAPI_URL`: Base URL of your Strapi installation (e.g., `https://your-strapi.com`)
- `STRAPI_API_TOKEN`: (Optional) API token for authenticated requests
- `STRAPI_CONTENT_TYPE`: (Optional) Content type name in Strapi (defaults to `marker-mappings`)

## Strapi Content Type Structure

Create a content type in Strapi called `marker-mappings` (or configure via `STRAPI_CONTENT_TYPE`) with the following fields:

### Required Fields

- **markerId** (Number): The AR.js barcode marker ID (0-255)
- **modelUrl** (Text or URL): Path to the glTF/GLB 3D model

### Optional Fields

- **qrCodeData** (Text): QR code data string (defaults to `marker-{markerId}` if not provided)
- **objectName** (Text): Display name (defaults to "Unnamed Object" if not provided)
- **active** (Boolean): Whether the marker is active (defaults to `true`)

## Setting Up Strapi Content Type

1. Start Strapi: `docker compose up -d strapi`
2. Access admin panel: `http://localhost:1337/admin`
3. Create admin account (first time only)
4. Go to Content-Type Builder
5. Create a new Collection Type named `marker-mappings` (or your custom name)
6. Add the following fields:
   - `markerId` (Number, Required)
   - `modelUrl` (Text or URL, Required)
   - `qrCodeData` (Text, Optional)
   - `objectName` (Text, Optional)
   - `active` (Boolean, Optional, Default: true)
7. Save and restart Strapi
8. Go to Content Manager and create your marker mappings
9. Publish the entries (important: only published entries are fetched)

## API Token (Optional)

For authenticated API access:

1. Go to Settings > API Tokens in Strapi admin panel
2. Create a new API token
3. Set permissions to `find` for the `marker-mappings` content type
4. Copy the token and set it as `STRAPI_API_TOKEN` environment variable

## Example Strapi Entry

Create entries in Strapi with:
- **markerId**: `5`
- **objectName**: `Demo Chair`
- **modelUrl**: `https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Chair/glTF/Chair.gltf`
- **qrCodeData**: `chair-qr-001`
- **active**: `true`

Make sure to **publish** the entry after creating it.

## Customizing Content Type Name

If you want to use a different content type name, set the `STRAPI_CONTENT_TYPE` environment variable:

```bash
STRAPI_CONTENT_TYPE=my-custom-content-type
```

## Priority

- The app uses Strapi when `STRAPI_URL` is set; Strapi must be configured for the API and admin endpoints to work.

## Testing

1. Set `STRAPI_URL` in your environment (or use Docker Compose default)
2. Ensure Strapi content type is set up and entries are published
3. Restart the server
4. Check logs: should see "Using Strapi CMS as content source"
5. Visit `/api/mappings` to see entries fetched from Strapi


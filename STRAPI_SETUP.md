# Strapi CMS Setup Guide for AR Marker Management System

This project uses **Strapi CMS** as the single source of truth for AR marker mappings. All marker data (create, read, update, delete) is managed through Strapi's Content API. The web application fetches marker mappings from Strapi and dynamically creates AR.js markers for display in the browser.

## Overview

The application integrates with Strapi to:
- Store AR marker configurations (markerId, 3D model URLs, object names, QR codes)
- Serve active marker mappings to the web frontend via `/api/mappings`
- Provide admin API endpoints for CRUD operations on markers
- Filter and validate marker data before serving to the AR application

## Quick Start with Docker Compose

The easiest way to get started is using Docker Compose, which sets up all services automatically:

```bash
docker compose up -d --build
```

This will start:
- **PostgreSQL** (for Strapi database) - `localhost:5433` (host) → `5432` (container)
- **Strapi CMS** - `http://localhost:1337`
- **AR Application** - `http://localhost:3001`

### First-Time Strapi Setup

1. **Access Strapi Admin Panel**
   - Open `http://localhost:1337/admin` in your browser
   - Create an admin account (first-time only)
   - Fill in your details and create the admin user

2. **Create the Content Type** (see detailed steps below)

3. **Configure API Permissions** (see API Token section below)

## Content Type Configuration

### Content Type Name

The application expects a content type named **`markers`** by default. This can be customized via the `STRAPI_CONTENT_TYPE` environment variable.

**Default:** `markers`  
**Custom:** Set `STRAPI_CONTENT_TYPE=your-custom-name` in `docker-compose.yml` or `.env`

### Required Fields

Create a **Collection Type** in Strapi with the following fields:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `markerId` | **Number** (Integer) | ✅ Yes | AR.js barcode marker ID (0-255). Used to map to pattern files: `pattern-{markerId}.patt` |
| `modelUrl` | **Text** or **URL** | ✅ Yes | Full URL or path to the glTF/GLB 3D model file |
| `qrCodeData` | **Text** | ✅ Yes | QR code data string (used for identification) |
| `objectName` | **Text** | ✅ Yes | Display name shown in the AR scene |
| `active` | **Boolean** | ❌ No | Whether the marker is active (defaults to `true` if not provided) |

### Step-by-Step Content Type Creation

1. **Start Strapi** (if not already running):
   ```bash
   docker compose up -d strapi
   ```

2. **Access Content-Type Builder**:
   - Go to `http://localhost:1337/admin`
   - Navigate to **Content-Type Builder** in the left sidebar
   - Click **"Create new collection type"**

3. **Name the Collection Type**:
   - Enter: `markers` (or your custom name matching `STRAPI_CONTENT_TYPE`)
   - Click **Continue**

4. **Add Fields** (in this order):

   **Field 1: markerId**
   - Click **"Add another field"**
   - Select **Number**
   - Display name: `markerId`
   - Type: **Integer**
   - Required: ✅ **Yes**
   - Click **Finish**

   **Field 2: modelUrl**
   - Click **"Add another field"**
   - Select **Text** (or **URL** if available)
   - Display name: `modelUrl`
   - Type: **Short text** (or **URL**)
   - Required: ✅ **Yes**
   - Click **Finish**

   **Field 3: qrCodeData**
   - Click **"Add another field"**
   - Select **Text**
   - Display name: `qrCodeData`
   - Type: **Short text**
   - Required: ✅ **Yes**
   - Click **Finish**

   **Field 4: objectName**
   - Click **"Add another field"**
   - Select **Text**
   - Display name: `objectName`
   - Type: **Short text**
   - Required: ✅ **Yes**
   - Click **Finish**

   **Field 5: active**
   - Click **"Add another field"**
   - Select **Boolean**
   - Display name: `active`
   - Default value: ✅ **True**
   - Required: ❌ **No**
   - Click **Finish**

5. **Save the Content Type**:
   - Click **"Save"** in the top right
   - Strapi will restart automatically

6. **Configure Permissions**:
   - Go to **Settings** → **Users & Permissions plugin** → **Roles** → **Public**
   - Under **Permissions**, find `markers`
   - Enable **find** and **findOne** (for public API access)
   - Click **Save**

## API Token Configuration (Recommended)

For authenticated API access and admin operations, create an API token:

1. **Create API Token**:
   - Go to **Settings** → **API Tokens** in Strapi admin
   - Click **"Create new API Token"**
   - Name: `AR App Token` (or any name)
   - Token type: **Full access** (or customize permissions)
   - Token duration: **Unlimited** (or set expiration)
   - Click **Save**

2. **Set Permissions** (if using custom permissions):
   - Ensure the token has **find**, **findOne**, **create**, **update**, and **delete** permissions for the `markers` content type

3. **Configure in Application**:
   - Copy the generated token
   - Update `docker-compose.yml`:
     ```yaml
     environment:
       STRAPI_API_TOKEN: your-copied-token-here
     ```
   - Or set in `.env` file:
     ```env
     STRAPI_API_TOKEN=your-copied-token-here
     ```

4. **Restart the Application**:
   ```bash
   docker compose restart app
   ```

## Creating Marker Mappings

### Via Strapi Admin Panel

1. **Navigate to Content Manager**:
   - Go to `http://localhost:1337/admin`
   - Click **Content Manager** → **Markers**

2. **Create New Entry**:
   - Click **"Create new entry"**
   - Fill in the fields:
     - **markerId**: `5` (must be a number 0-255)
     - **objectName**: `Demo Chair`
     - **modelUrl**: `https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Chair/glTF/Chair.gltf`
     - **qrCodeData**: `chair-qr-001`
     - **active**: `true` ✅

3. **Publish the Entry**:
   - Click **"Save"** (draft)
   - Click **"Publish"** button
   - ⚠️ **Important**: Only **published** entries are fetched by the application

### Via API (Programmatic)

You can also create markers via the admin API:

```bash
# Create a marker
curl -X POST http://localhost:3001/api/admin/markers \
  -H "Content-Type: application/json" \
  -d '{
    "markerId": 5,
    "objectName": "Demo Chair",
    "modelUrl": "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Chair/glTF/Chair.gltf",
    "qrCodeData": "chair-qr-001",
    "active": true
  }'
```

## Environment Variables

Configure these environment variables in `docker-compose.yml` or `.env`:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STRAPI_URL` | Base URL of Strapi instance | - | ✅ Yes |
| `STRAPI_API_TOKEN` | API token for authenticated requests | - | ❌ No (recommended) |
| `STRAPI_CONTENT_TYPE` | Content type name in Strapi | `markers` | ❌ No |

### Example Configuration

**docker-compose.yml:**
```yaml
environment:
  STRAPI_URL: http://strapi:1337
  STRAPI_CONTENT_TYPE: markers
  STRAPI_API_TOKEN: your-api-token-here
```

**.env file:**
```env
STRAPI_URL=http://localhost:1337
STRAPI_CONTENT_TYPE=markers
STRAPI_API_TOKEN=your-api-token-here
```

## Application API Endpoints

The application provides the following endpoints:

### Public Endpoints

- **GET `/api/mappings`**
  - Returns all active, published marker mappings
  - Filters: Only entries where `active=true` and `markerId` is a valid number
  - Used by the web frontend to dynamically create AR markers

### Admin Endpoints

- **POST `/api/admin/markers`**
  - Creates a new marker mapping
  - Body: `{ markerId, qrCodeData, objectName, modelUrl, active? }`
  - Returns: Created marker object

- **PUT `/api/admin/markers/:markerId`**
  - Updates an existing marker by `markerId`
  - Body: `{ qrCodeData?, objectName?, modelUrl?, active? }`
  - Returns: Updated marker object

- **DELETE `/api/admin/markers/:markerId`**
  - Deletes a marker by `markerId`
  - Returns: 204 No Content

## How It Works

### Data Flow

1. **Content Creation**: Admin creates marker entries in Strapi and publishes them
2. **API Fetch**: Web application calls `/api/mappings` endpoint
3. **Strapi Query**: Application queries Strapi API: `/api/markers?publicationState=live&pagination[limit]=1000`
4. **Filtering**: Only active entries with valid numeric `markerId` are returned
5. **Frontend Rendering**: JavaScript in `view/index.html` dynamically creates AR.js markers
6. **Pattern Mapping**: Each `markerId` maps to a pattern file: `/markers/patterns/pattern-{markerId}.patt`

### Pattern File Mapping

The application maps `markerId` to pattern files:
- `markerId: 1` → `/markers/patterns/pattern-01.patt`
- `markerId: 5` → `/markers/patterns/pattern-05.patt`
- `markerId: 42` → `/markers/patterns/pattern-42.patt`

Pattern files must exist in the `markers/patterns/` directory. The project includes patterns 00-63.

### 3D Model Requirements

- **Format**: glTF (.gltf) or GLB (.glb) files
- **URL**: Can be absolute URL (CDN) or relative path
- **CORS**: If hosting externally, ensure CORS headers allow access
- **Size**: Recommended to keep models under 10MB for web performance

## Testing the Integration

1. **Verify Strapi is Running**:
   ```bash
   curl http://localhost:1337/api/markers
   ```
   Should return JSON (may be empty array if no entries)

2. **Check Application Logs**:
   ```bash
   docker compose logs app
   ```
   Should show: `Using Strapi CMS as content source: http://strapi:1337`

3. **Test API Endpoint**:
   ```bash
   curl http://localhost:3001/api/mappings
   ```
   Should return array of active marker mappings

4. **Test in Browser**:
   - Open `http://localhost:3001`
   - Open browser console (F12)
   - Look for marker creation logs
   - Point camera at a printed marker pattern

## Troubleshooting

### Issue: "Strapi integration is not configured"

**Solution**: Set `STRAPI_URL` environment variable in `docker-compose.yml` or `.env`

### Issue: Empty array returned from `/api/mappings`

**Possible Causes**:
- No entries created in Strapi
- Entries are not published (must click "Publish" button)
- Entries have `active=false`
- `markerId` is not a valid number

**Solution**: 
- Check Strapi Content Manager
- Ensure entries are published
- Verify `active=true`
- Check `markerId` is a number

### Issue: 401 Unauthorized errors

**Solution**: 
- Create and configure API token
- Set `STRAPI_API_TOKEN` environment variable
- Ensure token has correct permissions in Strapi

### Issue: 404 Not Found when creating/updating markers

**Solution**: 
- Verify content type name matches `STRAPI_CONTENT_TYPE`
- Check that `markerId` exists in Strapi (for updates)
- Ensure API token has create/update permissions

### Issue: Markers not appearing in AR scene

**Possible Causes**:
- Pattern file doesn't exist for that `markerId`
- Model URL is invalid or inaccessible
- CORS issues with external model URLs
- Camera permissions not granted

**Solution**:
- Verify pattern file exists: `/markers/patterns/pattern-{markerId}.patt`
- Test model URL in browser
- Check browser console for errors
- Grant camera permissions

## Advanced Configuration

### Using External Strapi Instance

To use an external Strapi instance instead of Docker:

1. Remove or comment out Strapi services in `docker-compose.yml`
2. Set `STRAPI_URL` to your external URL:
   ```yaml
   environment:
     STRAPI_URL: https://your-strapi-instance.com
   ```

### Custom Content Type Name

If you want to use a different content type name:

1. Create the content type in Strapi with your custom name
2. Set `STRAPI_CONTENT_TYPE` environment variable:
   ```yaml
   environment:
     STRAPI_CONTENT_TYPE: my-custom-markers
   ```

### Multiple Environments

For different environments (dev/staging/prod):

- **Development**: Use Docker Compose defaults
- **Production**: Set `STRAPI_URL` to production Strapi instance
- Use `.env` files for environment-specific configuration

## Best Practices

1. **Always Publish Entries**: Unpublished entries are not fetched by the application
2. **Use API Tokens**: Enable authentication for production environments
3. **Validate Data**: Ensure `markerId` is within 0-255 range
4. **Optimize Models**: Compress 3D models for better web performance
5. **Monitor Logs**: Check application logs for Strapi connection issues
6. **Backup Data**: Regularly backup Strapi database
7. **Test Locally**: Test marker configurations before deploying

## Additional Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [AR.js Documentation](https://ar-js-org.github.io/AR.js-Docs/)
- [A-Frame Documentation](https://aframe.io/docs/)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)

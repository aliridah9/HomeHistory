# HomeHistory API Routes

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.homehistory.com/api`

## Authentication

All routes except `/auth/login` and `/auth/register` require Bearer token authentication.

```
Authorization: Bearer <token>
```

## Route Map

### Authentication (`/auth`)

| Method | Endpoint         | Description               | Auth Required |
| ------ | ---------------- | ------------------------- | ------------- |
| POST   | `/auth/register` | Register new user         | No            |
| POST   | `/auth/login`    | Login with email/password | No            |
| POST   | `/auth/supabase` | Login with Supabase token | No            |
| GET    | `/auth/me`       | Get current user          | Yes           |
| POST   | `/auth/refresh`  | Refresh access token      | Yes           |

### Ingestion (`/ingestion`)

| Method | Endpoint                         | Description                      | Auth Required |
| ------ | -------------------------------- | -------------------------------- | ------------- |
| POST   | `/ingestion/trigger`             | Trigger specific data source     | Yes           |
| POST   | `/ingestion/trigger/:propertyId` | Trigger all sources for property | Yes           |
| GET    | `/ingestion/status/:propertyId`  | Get sync status                  | Yes           |
| GET    | `/ingestion/history/:propertyId` | Get ingestion history            | Yes           |

### Parsing (`/parsing`)

| Method | Endpoint                      | Description              | Auth Required |
| ------ | ----------------------------- | ------------------------ | ------------- |
| POST   | `/parsing/parse/:documentId`  | Parse specific document  | Yes           |
| POST   | `/parsing/parse-batch`        | Parse multiple documents | Yes           |
| GET    | `/parsing/status/:documentId` | Get parsing status       | Yes           |
| GET    | `/parsing/queue`              | View parsing queue       | Yes (Admin)   |

### Validation (`/validation`)

| Method | Endpoint                   | Description            | Auth Required |
| ------ | -------------------------- | ---------------------- | ------------- |
| GET    | `/validation/pending`      | List pending documents | Yes (Admin)   |
| GET    | `/validation/document/:id` | Get document details   | Yes (Admin)   |
| POST   | `/validation/approve/:id`  | Approve document       | Yes (Admin)   |
| POST   | `/validation/reject/:id`   | Reject document        | Yes (Admin)   |
| POST   | `/validation/bulk-action`  | Bulk approve/reject    | Yes (Admin)   |

### Report Builder (`/reports`)

| Method | Endpoint                        | Description           | Auth Required |
| ------ | ------------------------------- | --------------------- | ------------- |
| POST   | `/reports/generate/:propertyId` | Generate new report   | Yes           |
| GET    | `/reports/:reportId`            | Get report            | Yes           |
| GET    | `/reports/property/:propertyId` | List property reports | Yes           |
| PUT    | `/reports/:reportId`            | Update report         | Yes           |
| POST   | `/reports/:reportId/publish`    | Publish report        | Yes           |
| GET    | `/reports/:reportId/pdf`        | Download PDF          | Yes           |

### Search (`/search`)

| Method | Endpoint                      | Description             | Auth Required |
| ------ | ----------------------------- | ----------------------- | ------------- |
| POST   | `/search/natural`             | Natural language search | Yes           |
| POST   | `/search/filters`             | Search with filters     | Yes           |
| GET    | `/search/suggestions`         | Get search suggestions  | Yes           |
| POST   | `/search/similar/:propertyId` | Find similar properties | Yes           |

### Scoring (`/scoring`)

| Method | Endpoint                         | Description            | Auth Required |
| ------ | -------------------------------- | ---------------------- | ------------- |
| GET    | `/scoring/:propertyId`           | Get property scores    | Yes           |
| POST   | `/scoring/calculate/:propertyId` | Recalculate scores     | Yes           |
| GET    | `/scoring/:propertyId/breakdown` | Get detailed breakdown | Yes           |
| GET    | `/scoring/:propertyId/history`   | Get score history      | Yes           |

## Example DTOs

### TriggerIngestionDto

```json
{
  "propertyId": "uuid",
  "dataSourceName": "zillow",
  "forceRefresh": false
}
```

### ParseDocumentDto

```json
{
  "documentId": "uuid",
  "parseOptions": {
    "extractImages": true,
    "ocrEnabled": true,
    "language": "en"
  }
}
```

### ValidateDocumentDto

```json
{
  "documentId": "uuid",
  "action": "approve",
  "notes": "Verified against county records"
}
```

### GenerateReportDto

```json
{
  "propertyId": "uuid",
  "reportType": "comprehensive",
  "includeScoring": true,
  "includeComparables": true
}
```

### NaturalSearchDto

```json
{
  "query": "Show me properties with recent water damage in San Francisco",
  "limit": 10,
  "includeEmbeddings": true
}
```

### PropertyScoreDto

```json
{
  "propertyId": "uuid",
  "scores": {
    "quality": 8.5,
    "safety": 9.0,
    "value": 7.8,
    "location": 8.2,
    "overall": 8.4
  },
  "explanation": "High safety score due to recent upgrades...",
  "calculatedAt": "2024-01-15T10:00:00Z"
}
```

## Supabase RLS Integration

All database queries are executed with Row Level Security (RLS) context:

1. User authentication token is validated
2. User ID is set in Postgres session
3. RLS policies automatically filter data
4. Only user's own properties and documents are accessible

### RLS Policies Example

```sql
-- Properties: Users can only see their own
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

-- Reports: Users can only see reports for their properties
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = reports.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Admin override for validation
CREATE POLICY "Admins can view all documents" ON raw_documents
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = raw_documents.property_id
      AND properties.user_id = auth.uid()
    )
  );
```

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["propertyId must be a string"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "You do not have access to this resource"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Property not found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

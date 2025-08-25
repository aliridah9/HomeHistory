# HomeHistory API

NestJS backend with modular architecture for property data management.

## Architecture

### Modules

1. **Ingestion Module** (`/api/ingestion`)
   - Cron jobs for automated data sync
   - On-demand sync from external sources (Zillow, County Records, etc.)
   - Stores raw data in `RawDocument` table
   - Queue-based processing with Bull

2. **Parsing Module** (`/api/parsing`)
   - PDF parsing with `pdf-parse`
   - Text extraction and structuring
   - Converts raw documents to structured data
   - Background job processing

3. **Validation Module** (`/api/validation`)
   - Admin-only endpoints
   - Document approval/rejection workflow
   - Bulk operations support
   - Status tracking

4. **Report Builder Module** (`/api/reports`)
   - Combines structured data into comprehensive reports
   - OpenAI integration for summaries and insights
   - PDF generation
   - Publishing workflow

5. **Search Module** (`/api/search`)
   - Natural language search with pgvector
   - Filter-based search
   - Search suggestions
   - Similar property recommendations

6. **Scoring Module** (`/api/scoring`)
   - Multi-factor property scoring (quality, safety, value, location)
   - Score history tracking
   - Detailed breakdowns with explanations
   - Automated recalculation

## Database Integration

- **Prisma ORM** for type-safe database access
- **Supabase** for PostgreSQL hosting
- **Row Level Security (RLS)** for data isolation
- **pgvector** for semantic search

## External Integrations

- **Zillow API** - Property data and estimates
- **County Records API** - Permits and official records
- **Tax Assessor API** - Tax history and assessments
- **Permit Data API** - Building permits and inspections
- **Google Maps API** - Location and proximity data
- **OpenAI API** - Report generation and insights

## Authentication

- JWT-based authentication
- Supabase Auth integration
- Role-based access control (User/Admin)
- RLS policies for data security

## Key Features

- **Automated Data Ingestion**: Scheduled and on-demand syncing
- **Document Processing**: Extract structured data from PDFs and raw documents
- **AI-Powered Reports**: Generate comprehensive property reports with insights
- **Vector Search**: Natural language property search
- **Scoring System**: Multi-factor property evaluation
- **Admin Dashboard**: Document validation queue

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start:prod
```

## Environment Variables

See `.env.example` for required configuration.

## API Documentation

Swagger documentation available at: http://localhost:3001/api/docs

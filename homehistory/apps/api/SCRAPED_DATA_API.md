# Scraped Data API Documentation

## Overview

This document describes the REST APIs for accessing scraped real estate and business listing data from various portals including Zillow, Redfin, Trulia, Century 21, LoopNet, and BizBuySell.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Most endpoints require JWT authentication. Include the bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Admin-only endpoints (like ingestion) require ADMIN role.

## Data Ingestion

### Ingest Scraped Data

**POST** `/ingest/scraped`

Triggers the ingestion of all JSON files from the scraped-data directory into the database.

**Authorization:** Admin only

**Response:**

```json
{
  "success": true,
  "message": "Data ingestion completed",
  "totalFiles": 11,
  "processedFiles": 11,
  "errors": [],
  "stats": {
    "listings": {
      "created": 450,
      "updated": 0,
      "errors": 0
    },
    "businesses": {
      "created": 25,
      "updated": 0,
      "errors": 0
    },
    "portals": ["zillow", "redfin", "trulia", "century21", "loopnet", "bizbuysell"]
  }
}
```

### Get Ingestion Status

**GET** `/ingest/status`

Returns current statistics about ingested data.

**Authorization:** Admin only

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalListings": 450,
    "totalBusinesses": 25,
    "byPortal": [
      { "portal": "zillow", "listings": 200, "businesses": 0 },
      { "portal": "redfin", "listings": 100, "businesses": 0 },
      { "portal": "trulia", "listings": 100, "businesses": 0 },
      { "portal": "century21", "listings": 50, "businesses": 0 },
      { "portal": "loopnet", "listings": 0, "businesses": 15 },
      { "portal": "bizbuysell", "listings": 0, "businesses": 10 }
    ]
  }
}
```

## Residential Listings API

### Get Listings

**GET** `/listings`

Retrieves residential property listings with filtering, search, and pagination.

**Query Parameters:**

- `source` (string, optional): Portal source - `zillow`, `redfin`, `trulia`, `century21`
- `city` (string, optional): Filter by city name
- `state` (string, optional): Filter by state code (e.g., "TX", "NV", "CA")
- `minPrice` (number, optional): Minimum price in USD
- `maxPrice` (number, optional): Maximum price in USD
- `beds` (number, optional): Minimum number of bedrooms
- `baths` (number, optional): Minimum number of bathrooms
- `homeType` (string, optional): Property type filter (e.g., "House", "Condo", "Apartment")
- `q` (string, optional): Search query for address or description
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
curl -X GET "http://localhost:3001/api/listings?city=Houston&state=TX&minPrice=300000&maxPrice=700000&beds=3&page=1&pageSize=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "data": [
    {
      "id": "clp123abc",
      "price": 650000,
      "address": "1916 Hawthorne St, Houston, TX 77098",
      "city": "Houston",
      "state": "TX",
      "zipcode": "77098",
      "beds": 3,
      "baths": 2,
      "sqft": 1377,
      "thumbnail": "https://photos.zillowstatic.com/...",
      "brokerage": "MY CASTLE REALTY",
      "propertyType": "House",
      "source": "zillow"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get Listing Details

**GET** `/listings/:id`

Retrieves detailed information for a specific listing.

**Response:**

```json
{
  "id": "clp123abc",
  "source": "zillow",
  "sourceUrl": "https://www.zillow.com/homedetails/...",
  "propertyType": "House",
  "status": "For Sale",
  "address": {
    "line1": "1916 Hawthorne St",
    "city": "Houston",
    "state": "TX",
    "zipcode": "77098",
    "full": "1916 Hawthorne St, Houston, TX 77098"
  },
  "price": 650000,
  "lastSoldPrice": 450000,
  "propertyTaxRate": 0.47,
  "beds": 3,
  "baths": 2,
  "livingAreaSqft": 1377,
  "lotSizeSqft": 6534,
  "lotSizeAcres": 0.15,
  "yearBuilt": 1951,
  "daysOnMarket": 21,
  "listingAgent": "John Smith",
  "brokerageName": "MY CASTLE REALTY",
  "thumbnailUrl": "https://photos.zillowstatic.com/...",
  "images": [
    "https://photos.zillowstatic.com/image1.jpg",
    "https://photos.zillowstatic.com/image2.jpg"
  ],
  "virtualTourUrl": "https://www.zillow.com/view-imx/...",
  "isZillowOwned": false,
  "description": "Beautiful single-story home...",
  "raw": {
    /* Original scraped data */
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Get Listing Statistics

**GET** `/listings/stats/overview`

Returns aggregated statistics for all listings.

**Response:**

```json
{
  "total": 450,
  "byPortal": [
    { "portal": "zillow", "count": 200 },
    { "portal": "redfin", "count": 100 },
    { "portal": "trulia", "count": 100 },
    { "portal": "century21", "count": 50 }
  ],
  "byState": [
    { "state": "TX", "count": 250 },
    { "state": "NV", "count": 150 },
    { "state": "CA", "count": 50 }
  ],
  "priceStats": {
    "average": 485000,
    "min": 75000,
    "max": 1300000
  },
  "propertyTypes": [
    { "type": "House", "count": 300 },
    { "type": "Condo", "count": 80 },
    { "type": "Apartment", "count": 50 },
    { "type": "Lot/Land", "count": 20 }
  ]
}
```

## Business Listings API

### Get Business Listings

**GET** `/businesses`

Retrieves business listings with filtering and pagination.

**Query Parameters:**

- `source` (string, optional): Portal source - `loopnet`, `bizbuysell`
- `state` (string, optional): Filter by state code
- `minPrice` (number, optional): Minimum asking price in USD
- `maxPrice` (number, optional): Maximum asking price in USD
- `minRevenue` (number, optional): Minimum annual revenue in USD
- `minCashflow` (number, optional): Minimum annual cashflow in USD
- `employees` (number, optional): Maximum number of employees
- `q` (string, optional): Search query for title, location, or description
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
curl -X GET "http://localhost:3001/api/businesses?source=bizbuysell&state=CA&minPrice=50000&maxPrice=500000&page=1" \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "data": [
    {
      "id": "clb456def",
      "title": "Skincare Haus",
      "location": "Glendale, CA",
      "state": "CA",
      "price": 100000,
      "revenue": 100000,
      "cashflow": null,
      "ebitda": null,
      "employees": 2,
      "yearEstablished": null,
      "source": "bizbuysell"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

### Get Business Details

**GET** `/businesses/:id`

Retrieves detailed information for a specific business listing.

**Response:**

```json
{
  "id": "clb456def",
  "source": "bizbuysell",
  "sourceUrl": "https://www.bizbuysell.com/business-opportunity/...",
  "title": "Skincare Haus",
  "businessName": null,
  "location": "Glendale, CA",
  "state": "CA",
  "financials": {
    "price": 100000,
    "revenue": 100000,
    "ebitda": null,
    "cashflow": null
  },
  "employees": 2,
  "yearEstablished": null,
  "sellerType": "owner",
  "intermediary": {
    "firm": "N/A",
    "phone": "818-599-3355",
    "name": "araksya toramanyan"
  },
  "inventory": "$62,900 Included in asking price",
  "reasonForSelling": "owner retiring",
  "description": "Unlock the door to your entrepreneurial dreams...",
  "dateAdded": "08/24/2025",
  "images": [],
  "raw": {
    /* Original scraped data */
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Get Business Statistics

**GET** `/businesses/stats/overview`

Returns aggregated statistics for all business listings.

**Response:**

```json
{
  "total": 25,
  "byPortal": [
    { "portal": "loopnet", "count": 15 },
    { "portal": "bizbuysell", "count": 10 }
  ],
  "byState": [
    { "state": "CA", "count": 8 },
    { "state": "TX", "count": 5 },
    { "state": "FL", "count": 4 }
  ],
  "priceStats": {
    "average": 450000,
    "min": 50000,
    "max": 1650000
  },
  "revenueStats": {
    "average": 480000,
    "min": 100000,
    "max": 2000000
  },
  "cashflowStats": {
    "average": 150000,
    "min": 50000,
    "max": 300000
  }
}
```

## Running the Seed Script

To ingest all scraped data into the database, run:

```bash
# From the project root
pnpm --filter api run seed:scraped

# Or from the api directory
cd apps/api
pnpm run seed:scraped
```

## Environment Configuration

Add the following to your `.env` file:

```env
# Scraped Data Configuration
HH_SCRAPED_DATA_DIR=./scraped-data
```

The default path is `./scraped-data` relative to the project root.

## Data Sources

The system ingests data from the following JSON files:

### Residential Listings

- `zillow-la-lv-1.json`, `zillow-la-lv-2.json` - Zillow listings for Las Vegas
- `zillow-tx-houston.json` - Zillow listings for Houston
- `redfin-la.json` - Redfin listings for Los Angeles
- `redin-tx-houston.json` - Redfin listings for Houston
- `trulia-la.json` - Trulia listings for Los Angeles
- `trulia-houston.json` - Trulia listings for Houston
- `century-21-lot-apartments-la.json` - Century 21 lots/apartments in LA
- `century-21-Condo-Townhome-FarmRanch-la.json` - Century 21 condos/townhomes in LA

### Business Listings

- `loopnet-business-coffee-shops-and-cafes-for-sale.json` - LoopNet coffee shops/cafes
- `dataset_bizbuysell-business.json` - BizBuySell business opportunities

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error responses include a message:

```json
{
  "statusCode": 404,
  "message": "Listing not found",
  "error": "Not Found"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Default limits:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Caching

GET endpoints implement caching for improved performance:

- Listing/Business lists: 5 minutes
- Individual details: 10 minutes
- Statistics: 30 minutes

# Landing Page Implementation

This document describes the pixel-perfect landing page implementation matching the provided screenshot.

## Overview

The landing page has been rebuilt from scratch with the following key features:

- Pixel-perfect match to screenshot design
- Fully responsive (desktop/tablet/mobile)
- Clean, typed TypeScript components
- Accessible with proper ARIA labels and keyboard navigation
- Performance optimized with lazy loading
- Graceful API fallbacks with mock data

## Assets Used

All images are located in `src/assets/` and imported via Vite:

- `logo.jpg` - HomeHistory logo (cropped to circle in navbar)
- `main-img.jpg` - Hero background image
- `popular-properties-1.jpg` - Villa property card
- `popular-properties-2.jpg` - Condo property card
- `popular-properties-3.jpg` - Commercial property card
- `report-img.jpg` - Report showcase and list promo image
- `finance-your-future.jpg` - Finance promo image
- `trusted-contractors-1.jpg` - Sarah Johnson contractor
- `trusted-contractors-2.jpg` - Mike Chen contractor
- `trusted-contractors-3.jpg` - David Rodriguez contractor

## Component Structure

```
src/components/landing/
├── Navbar.tsx              - Sticky navigation with logo and CTAs
├── Hero.tsx                 - Main hero with headline and search bar
├── SearchBar.tsx            - Search component with chips and input
├── PropertyCard.tsx         - Reusable property card component
├── PopularProperties.tsx    - Properties grid with navigation
├── ReportShowcase.tsx       - 3-card report preview section
├── TwoColPromo.tsx         - Reusable two-column promo component
├── ContractorsRow.tsx      - Contractor profile cards
├── DirectoryTable.tsx      - Dark tabbed table section
├── FAQ.tsx                 - Accordion FAQ section
└── Footer.tsx              - Footer with AI Assistant FAB
```

## Design Tokens

The implementation uses exact Tailwind utilities matching the screenshot:

- **Container**: `max-w-[1200px] mx-auto px-6`
- **Sections**: `py-16` vertical spacing
- **Radii**: `rounded-3xl` (hero), `rounded-2xl` (cards), `rounded-full` (pills)
- **Shadows**: `shadow-xl` (hero), `shadow-md` (cards)
- **Typography**: Inter font, specific text sizes for pixel-perfect match
- **Colors**: Zinc color palette with blue-600 primary

## Data Integration

The landing page fetches data from backend endpoints with graceful fallbacks:

```typescript
// API functions in src/lib/api.ts
getPopularProperties(); // -> /properties?limit=6&location=NY
getContractors(); // -> /contractors?limit=3
getDirectory(kind); // -> /directory/{kind}
getFaqs(); // -> /faqs
```

If API calls fail, the page renders with mock data to ensure the UI never breaks.

## Responsive Behavior

- **Desktop (≥1280px)**: Full 3-column layouts, complete table view
- **Tablet (768-1279px)**: 2-column grids, abbreviated layouts
- **Mobile (≤767px)**: Single column, cards replace tables

## Accessibility Features

- Semantic HTML structure
- Alt text on all images
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Performance Optimizations

- `loading="lazy"` on below-the-fold images
- Component lazy loading
- Efficient re-renders with proper React patterns
- Minimal bundle size with tree-shaken imports

## Routes

The landing page is available at `/` with navigation links to:

- `/buy` - Buy properties page (placeholder)
- `/rent` - Rent properties page (placeholder)
- `/sell` - Sell properties page (placeholder)
- `/auction` - Auction properties page (placeholder)

## Development

To run the landing page locally:

```bash
cd homehistory/apps/web
pnpm dev
```

The page will be available at `http://localhost:5173/`

## Build

The landing page builds without errors:

```bash
pnpm build
pnpm preview
```

All TypeScript types are properly defined and ESLint passes without warnings.

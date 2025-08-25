# HomeHistory Monorepo

A comprehensive home management platform built with modern web technologies.

## 🏗️ Architecture

This monorepo is organized using pnpm workspaces and includes:

- **`apps/web`** - React + Vite + TypeScript frontend with Tailwind CSS and shadcn/ui
- **`apps/api`** - NestJS 10 backend with Prisma ORM and Supabase integration
- **`packages/ui`** - Shared UI components library
- **`packages/types`** - Shared TypeScript types and interfaces
- **`packages/database`** - Shared database schemas and migrations
- **`docs`** - VitePress documentation site

## 🚀 Tech Stack

### Frontend (apps/web)

- React 18
- Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query)
- Zustand for state management
- React Router

### Backend (apps/api)

- NestJS 10
- Prisma ORM
- Supabase (PostgreSQL, Auth, Storage, pgvector)
- JWT authentication
- Swagger/OpenAPI documentation

### Shared Packages

- TypeScript
- ESLint + Prettier
- Vitest for testing

### Infrastructure & Tools

- pnpm workspaces
- Turbo for monorepo builds
- GitHub Actions CI/CD
- Vercel (frontend deployment)
- Supabase (backend deployment)
- Conventional Commits
- Semantic Release
- Husky pre-commit hooks
- Sentry error tracking
- Web Vitals monitoring

## 📋 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (via Supabase)

## 🛠️ Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/homehistory.git
   cd homehistory
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example env files:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```

   Update the environment variables with your Supabase credentials and other configurations.

4. **Set up the database**

   ```bash
   # Generate Prisma client
   pnpm --filter @homehistory/api prisma generate

   # Run migrations
   pnpm --filter @homehistory/api prisma migrate dev

   # Seed the database (optional)
   pnpm --filter @homehistory/api prisma db seed
   ```

## 📦 Development Commands

### Start all apps in development mode

```bash
pnpm dev
```

### Start specific apps

```bash
# Frontend only
pnpm dev:web

# Backend only
pnpm dev:api

# Documentation site
pnpm dev:docs
```

### Build commands

```bash
# Build all apps and packages
pnpm build

# Build specific apps
pnpm build:web
pnpm build:api
pnpm build:docs
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Linting and formatting

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check
```

### Type checking

```bash
pnpm typecheck
```

### Clean build artifacts

```bash
pnpm clean
```

### Database commands

```bash
# Generate Prisma client
pnpm --filter @homehistory/database prisma generate

# Create a new migration
pnpm --filter @homehistory/database prisma migrate dev --name <migration-name>

# Apply migrations
pnpm --filter @homehistory/database prisma migrate deploy

# Seed the database
pnpm --filter @homehistory/database prisma db seed

# Open Prisma Studio
pnpm --filter @homehistory/database prisma studio

# Push schema changes (development only)
pnpm --filter @homehistory/database prisma db push
```

### Git commits (Conventional Commits)

```bash
# Use commitizen for conventional commits
pnpm commit

# Or use git with conventional commit format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in authentication"
git commit -m "docs: update README"
```

## 📁 Project Structure

```
homehistory/
├── apps/
│   ├── web/                 # React frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── api/                 # NestJS backend
│       ├── src/
│       ├── prisma/
│       ├── test/
│       ├── nest-cli.json
│       └── package.json
├── packages/
│   ├── ui/                  # Shared UI components
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── types/               # Shared TypeScript types
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── database/            # Shared database utilities
│       ├── src/
│       ├── prisma/
│       └── package.json
├── docs/                    # VitePress documentation
│   ├── .vitepress/
│   ├── guide/
│   ├── api/
│   └── package.json
├── .github/
│   └── workflows/           # GitHub Actions
├── .husky/                  # Git hooks
├── .commitlintrc.js         # Commitlint config
├── .eslintrc.js             # ESLint config
├── .prettierrc              # Prettier config
├── .gitignore
├── .nvmrc                   # Node version
├── turbo.json               # Turbo config
├── pnpm-workspace.yaml      # pnpm workspaces
├── package.json             # Root package.json
└── README.md
```

## 🚢 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Configure environment variables
4. Deploy

### Backend (Supabase)

1. Create a Supabase project
2. Configure database connection in `.env`
3. Run migrations: `pnpm --filter @homehistory/api prisma migrate deploy`
4. Deploy using Supabase Edge Functions or your preferred hosting

### CI/CD Pipeline

GitHub Actions workflows are configured for:

- Running tests on pull requests
- Linting and type checking
- Building and deploying on merge to main
- Semantic versioning and releases

## 🔧 Configuration Files

- **`.commitlintrc.js`** - Conventional commits configuration
- **`.eslintrc.js`** - ESLint rules
- **`.prettierrc`** - Code formatting rules
- **`turbo.json`** - Turbo build pipeline configuration
- **`.husky/`** - Git hooks for pre-commit checks

## 📚 Documentation

Comprehensive documentation is available in the `docs` directory. To run the documentation site locally:

```bash
pnpm dev:docs
```

Visit http://localhost:5173 to view the documentation.

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/amazing-feature`
2. Commit your changes: `pnpm commit`
3. Push to the branch: `git push origin feat/amazing-feature`
4. Open a pull request

## 📄 License

This project is licensed under the MIT License.

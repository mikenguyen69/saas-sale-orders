# Sales Order Management SaaS

A comprehensive sales order management system built with Next.js, Supabase, and TypeScript.

## Features

- Role-based access control (Salesperson, Manager, Warehouse Staff)
- Complete order workflow (Draft → Submitted → Approved → Fulfilled → Rejected)
- Real-time stock validation
- File attachments and order history
- Responsive design with Material-UI components

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Material-UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker Desktop (for local Supabase)
- Supabase CLI (installed via npm)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd saas-sale-orders
```

2. Install dependencies:

```bash
npm install
```

3. **Start Local Supabase (IMPORTANT)**:

**For local development, you MUST start the local Supabase instance.**

```bash
# Start local Supabase with Docker
npm run db:start
```

This will start a local Supabase instance on your machine. Wait for all services to be ready.

**Common Issues:**

- If you get "Docker not found" errors, ensure Docker Desktop is installed and running
- On Windows, make sure Docker Desktop is running before executing this command
- The local database will be available at `postgresql://postgres:postgres@localhost:54322/postgres`

4. **Configure environment variables**:

The `.env.local` file should already be configured for local development with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

These are the default local Supabase credentials. **Do not change these for local development.**

**For Production**, use the credentials from your production Supabase project (see `.env` for reference).

5. Generate Prisma client:

```bash
npx prisma generate
```

6. Reset database with seed data:

```bash
npm run db:reset
```

This will apply migrations and seed the database with test users and data.

7. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Troubleshooting Database Connection Errors

If you encounter errors like:

```
Can't reach database server at db.xxx.supabase.co:5432
```

**Solution:**

1. Ensure Docker Desktop is running
2. Start local Supabase: `npm run db:start`
3. Verify Supabase is running: `npx supabase status`
4. Update `.env.local` to use local database URL (see step 4 above)
5. Restart your development server: `npm run dev`

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database

- `npm run db:start` - Start local Supabase instance (Docker required)
- `npm run db:stop` - Stop local Supabase instance
- `npm run db:reset` - Reset database and apply migrations with seed data

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Project Structure

```
src/
├── app/              # Next.js 13+ app directory
├── components/       # Reusable UI components
├── lib/              # Utility libraries (Supabase, Prisma, Auth)
├── services/         # Business logic services
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
└── __tests__/        # Test files
```

## Environment Variables

Required environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `DATABASE_URL` - Database connection string for Prisma

## CI/CD Pipeline

This project includes comprehensive GitHub Actions workflows:

### Workflows

- **CI Pipeline** (`.github/workflows/ci.yml`):
  - Runs on every push and pull request
  - Tests on Node.js 18.x and 20.x
  - Performs linting, formatting checks, type checking, and testing
  - Uploads test coverage to Codecov
  - Builds the application

- **Deployment** (`.github/workflows/deploy.yml`):
  - Automatically deploys to Vercel on main branch pushes
  - Runs tests before deployment
  - Can be manually triggered

- **Security Scanning** (`.github/workflows/security.yml`):
  - Runs npm audit for vulnerabilities
  - Performs CodeQL analysis for code security
  - Uses Trivy for comprehensive security scanning
  - Runs weekly on schedule

- **Dependency Updates** (`.github/workflows/dependency-update.yml`):
  - Automatically checks for outdated packages weekly
  - Creates pull requests with dependency updates
  - Ensures tests pass with updated dependencies

### Required Secrets

To use the GitHub Actions workflows, configure these secrets in your repository:

**Supabase:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

**Vercel Deployment:**

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Optional:**

- `CODECOV_TOKEN` (for test coverage reporting)

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Set up GitHub secrets for automated deployment
5. Deploy automatically via GitHub Actions or manually through Vercel

## Development Workflow

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Commit with meaningful messages
5. Create a pull request

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

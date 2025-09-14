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
- Supabase account

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

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials and other environment variables.

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run database migrations (when available):

```bash
npx prisma db push
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests

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

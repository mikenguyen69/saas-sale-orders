# 🏠 Local Supabase Setup Guide

This guide will help you set up Supabase locally for development. This provides a complete local database, authentication, and API server.

## 📋 Prerequisites

1. **Docker Desktop** - Required for running Supabase locally
   - [Install Docker Desktop](https://docs.docker.com/desktop/)
   - Make sure Docker is running

2. **Node.js 18+** (already installed)

## 🚀 Quick Setup

### 1. Start Local Supabase Services

```bash
# Start all Supabase services (database, auth, API, etc.)
npm run db:start
```

This will:

- Start PostgreSQL database on port `54322`
- Start Supabase API on port `54321`
- Start Supabase Studio on port `54323`
- Apply all migrations from `supabase/migrations/`
- Seed the database with sample data

### 2. Access Local Services

Once started, you can access:

- **Supabase Studio (Database UI)**: http://localhost:54323
- **API Endpoint**: http://localhost:54321
- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`

### 3. Start Your Application

```bash
# Start the Next.js development server
npm run dev
```

Your app will run on http://localhost:3000 and connect to the local Supabase instance.

## 🔧 Environment Variables

The `.env.local` file has been configured with local Supabase settings:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 📊 Sample Data

The local database includes:

### Users

- **John Doe** (Salesperson) - `john.doe@company.com`
- **Jane Smith** (Manager) - `jane.smith@company.com`
- **Bob Wilson** (Warehouse) - `bob.wilson@company.com`
- **Alice Johnson** (Salesperson) - `alice.johnson@company.com`

### Products

- Business Laptop Pro - `LAPTOP-001`
- Wireless Mouse - `MOUSE-001`
- Office Desk Standard - `DESK-001`
- Ergonomic Office Chair - `CHAIR-001`
- 24 inch LED Monitor - `MONITOR-001`

### Sample Orders

- 3 pre-created orders in different statuses (draft, submitted, approved)

## 🛠️ Useful Commands

```bash
# Stop Supabase services
npm run db:stop

# Reset database (drops all data and re-runs migrations + seeds)
npm run db:reset

# View Supabase status
npx supabase status

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/types/supabase.ts
```

## 🔍 Database Management

### Using Supabase Studio

1. Open http://localhost:54323
2. Navigate through tables, run queries, manage data
3. View authentication users, storage, and more

### Using Prisma Studio

```bash
npx prisma studio
```

### Direct Database Access

```bash
# Connect to local PostgreSQL
psql postgresql://postgres:postgres@localhost:54322/postgres
```

## 🧪 Testing Authentication

To test the authentication system:

1. The local instance has email confirmations disabled
2. You can sign up with any email
3. Users will be automatically created in the `users` table with default role
4. Or use the pre-seeded users for testing

## 🔄 Database Migrations

To create new migrations:

```bash
# Create a new migration file
npx supabase migration new your_migration_name

# Apply migrations
npm run db:reset
```

## 🌐 Switching to Production

To switch from local to production Supabase:

1. Create a project at [supabase.com](https://supabase.com)
2. Update `.env.local` with your production URLs and keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   DATABASE_URL=your_production_database_url
   ```
3. Run migrations on production:
   ```bash
   npx supabase db push
   ```

## 🚨 Troubleshooting

### Docker Issues

- Ensure Docker Desktop is running
- Try restarting Docker Desktop
- Check if ports 54321-54324 are available

### Database Connection Issues

- Verify Supabase is running: `npx supabase status`
- Check if the database URL in `.env.local` is correct
- Restart services: `npm run db:stop && npm run db:start`

### Port Conflicts

If default ports are in use, you can modify them in `supabase/config.toml`

---

## 🎯 Next Steps

With local Supabase running, you can:

- Test the complete authentication flow
- Create, read, update, and delete orders
- Test role-based permissions
- Develop new features with real database interactions
- Debug database queries and performance

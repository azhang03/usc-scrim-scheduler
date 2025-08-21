# USC Scrim Scheduler Backend

Express.js backend server for the USC Scrim Scheduler application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your Supabase credentials in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3002
```

4. Run the database schema:
   - Copy the contents of `schema.sql` and run it in your Supabase SQL editor
   - Run the migration script `migration.sql` if you have existing data

5. Start the development server:
```bash
npm run dev
```

The server will run on port 3002 by default.

## API Endpoints

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event (requires auth)
- `PUT /api/events/:id` - Update event (requires auth, owner only)
- `DELETE /api/events/:id` - Delete event (requires auth, owner only)

### Availability
- `GET /api/availability/event/:eventId` - Get availability for an event
- `POST /api/availability` - Save user availability (requires auth)
- `GET /api/availability/event/:eventId/user` - Get user's availability for an event (requires auth)

### Teams
- `GET /api/teams` - Get all teams

### Health Check
- `GET /health` - Server health check

## Authentication

All protected endpoints require a valid Supabase JWT token in the `Authorization: Bearer <token>` header.

## Database Schema

The application uses the following tables:
- `users` - User profiles
- `teams` - Available teams
- `events` - Scrim events
- `availability` - User availability for events

# ResolveAI Database Setup

## Supabase Configuration

1. **Create a Supabase Project** at [supabase.com](https://supabase.com)

2. **Copy Connection Details:**
   - Go to Project Settings → API
   - Copy `URL` and `anon key`
   - Go to Settings → Database → Connection pooling (if using pooler)
   - Copy `service_role_key` (KEEP SECRET - backend only)

3. **Run Schema Migration:**
   - Go to SQL Editor in Supabase dashboard
   - Create a new query and paste the contents of `schema.sql`
   - Click "Run"

## Environment Variables

Create `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# CORS
CLIENT_URL=http://localhost:5173
```

## Database Tables

### Users (extends auth.users)
- `id` - UUID, references auth.users
- `email` - User email
- `full_name` - Display name
- `avatar_url` - Profile picture
- `role` - citizen | moderator | admin
- `bio` - User bio
- `created_at`, `updated_at`

### Issues
- `id` - UUID
- `title`, `description` - Issue details
- `category` - Type of issue (pothole, garbage, etc.)
- `status` - Current workflow status
- `risk_level` - low | medium | high | critical
- `priority` - 0-100 score
- `location`, `latitude`, `longitude` - Location data
- `user_id` - Reporter
- `upvotes`, `downvotes`, `comments_count`, `views_count`
- `assigned_to` - Moderator/admin assignment
- `resolution_notes`, `resolved_at`
- `created_at`, `updated_at`

### Comments
- `id` - UUID
- `issue_id` - Parent issue
- `user_id` - Author
- `content` - Comment text
- `upvotes` - Vote count
- `created_at`, `updated_at`

### Issue Votes
- `id` - UUID
- `issue_id` - Voted issue
- `user_id` - Voter
- `vote_type` - upvote | downvote
- Unique constraint: one vote per user per issue

### Activity Logs
- `id` - UUID
- `issue_id` - Tracked issue
- `user_id` - Actor
- `action` - What was done
- `old_value`, `new_value` - Change tracking (JSONB)

### Notifications
- `id` - UUID
- `user_id` - Recipient
- `issue_id` - Related issue
- `type` - Notification type
- `title`, `message` - Content
- `is_read` - Read status

## RLS (Row Level Security)

All tables have RLS enabled:
- Users can view/edit own profiles
- Issues are public for viewing
- Users can create/edit own issues
- Admins/moderators can edit any issue
- Users can create/edit own comments

## Views

### dashboard_stats
Returns aggregate statistics:
- total_issues, resolved, in_progress, pending
- active_citizens, resolution_rate, avg_resolution_days

### issues_by_category
Counts issues per category

### issues_by_status
Counts issues per status

## Geospatial Features

Issues include PostGIS geographic data:
- `location_geom` - GEOGRAPHY point (latitude, longitude)
- Indexed with GIST for efficient spatial queries
- Enables proximity searches and heat maps

## Backup & Recovery

1. **Backup:** Go to Backups in Supabase dashboard
2. **Download:** Select a backup and restore or export
3. **Manual Backup:** Use `pg_dump` with your connection string

## Testing

After setup, verify tables exist:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

Verify RLS policies:

```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
```

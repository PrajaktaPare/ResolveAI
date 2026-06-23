# ResolveAI - Community Intelligence & Resolution Platform

**From Reporting Problems to Resolving Communities.**

[![Live Deploy](https://img.shields.io/badge/Deploy-Vercel-brightgreen)](https://resolve-ai.vercel.app)
> **Production App URL:** [https://resolve-ai.vercel.app](https://resolve-ai.vercel.app)
> **API Server URL:** [https://resolve-ai-api.railway.app](https://resolve-ai-api.railway.app)

---

## 📋 Our Plan & Vision
Our goal is to bridge the communication gap between citizens and municipal authorities by creating a hyperlocal civic issue tracking platform that is transparent, automated, and community-driven. 
1. **Report & Validate**: Citizens drop geolocated pins for local issues (potholes, garbage leaks, broken streetlights).
2. **AI Categorization & Assessment**: Gemini analyzes the uploaded issue context (images and details) to automatically categorize, extract severity level, and estimate community safety risks.
3. **Hyperlocal Civic Priority Engine**: Upvotes and nearby verification logs dynamically adjust an issue's priority score (0-100), ensuring the most urgent issues bubble up to the top of the municipality's dashboard.
4. **Resolution Tracking**: Municipal workers update the status dynamically, notifying users of the action taken and resolving the ticket.

---

## 🛠️ Why We Chose This Tech Stack

- **React 18 & Vite**: Offers high-performance, responsive UI components with Hot Module Replacement (HMR) for fast development and bundle builds.
- **Express.js (Node.js)**: A lightweight backend framework allowing quick routing and easy middleware integration (JWT validation, logging).
- **Supabase (Auth & PostgreSQL)**:
  - **Supabase Auth**: Out-of-the-box user registration, session tokens, and secure JWT-based verification.
  - **PostgreSQL**: Robust database supporting relational constraints, triggers, and views.
  - **PostGIS**: Provides spatial data types (`GEOGRAPHY`) and functions enabling geospatial indexing and proximity queries.
- **Leaflet & OpenStreetMap**: Free, customizable, open-source mapping libraries bypassing restrictive, paid API keys (like Google Maps API) while delivering responsive interactive map markers and locating user positions.
- **Google Gemini API**: Advanced LLM and Vision models for automated, zero-shot categorizations and risk analysis.

---

## 📊 Database Design & ER Diagram

The database structure relies on Supabase PostgreSQL with strict Row Level Security (RLS) for data protection. Below is the Entity-Relationship diagram showing how tables interact:

```mermaid
erDiagram
    users {
        uuid id PK "auth.users.id"
        varchar email UNIQUE
        varchar full_name
        text avatar_url
        varchar role "citizen | moderator | admin"
        text bio
        varchar location
        timestamp created_at
    }
    issues {
        uuid id PK
        varchar title
        text description
        varchar category
        varchar status
        varchar risk_level
        integer priority
        varchar location
        decimal latitude
        decimal longitude
        geography location_geom
        uuid user_id FK "users.id"
        integer upvotes
        integer comments_count
        timestamp resolved_at
        uuid assigned_to FK "users.id"
        timestamp created_at
    }
    comments {
        uuid id PK
        uuid issue_id FK "issues.id"
        uuid user_id FK "users.id"
        text content
        integer upvotes
        timestamp created_at
    }
    issue_votes {
        uuid id PK
        uuid issue_id FK "issues.id"
        uuid user_id FK "users.id"
        varchar vote_type "upvote | downvote"
        timestamp created_at
    }
    activity_logs {
        uuid id PK
        uuid issue_id FK "issues.id"
        uuid user_id FK "users.id"
        varchar action
        jsonb old_value
        jsonb new_value
        timestamp created_at
    }
    notifications {
        uuid id PK
        uuid user_id FK "users.id"
        uuid issue_id FK "issues.id"
        varchar type
        varchar title
        text message
        boolean is_read
        timestamp created_at
    }

    users ||--o{ issues : "reports"
    users ||--o{ comments : "writes"
    users ||--o{ issue_votes : "casts"
    users ||--o{ notifications : "receives"
    issues ||--o{ comments : "has"
    issues ||--o{ issue_votes : "receives"
    issues ||--o{ activity_logs : "tracks"
```

---

## Features

- **📸 Media-Based Reporting** - Report issues with photos/videos and GPS location
- **🤖 AI Categorization** - Gemini Vision auto-detects issue type, severity, and safety risk
- **👥 Community Verification** - Nearby citizens upvote/verify reports to build trust
- **📊 Priority Engine** - Dynamic 0-100 scoring blends severity, risk, verification, and impact
- **🗺️ Geo-Mapping** - OpenStreetMap + Leaflet maps show category-colored pins, hotspots, and high-priority zones
- **📈 Impact Dashboard** - Real-time resolution trends and community health scores
- **👮 Admin Panel** - Moderation tools for admins and moderators

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool with HMR
- **React Router** - Routing
- **TailwindCSS** - Styling
- **React Hook Form** - Form handling
- **Supabase Auth** - Authentication
- **Leaflet & React-Leaflet** - OpenStreetMap interactive maps
- **Recharts** - Data visualization
- **Axios** - API client

### Backend
- **Express.js** - Node.js server
- **Supabase** - PostgreSQL database & auth
- **Pino** - Logging
- **CORS/Helmet** - Security middleware
- **Gemini API** - AI categorization (optional)

### Infrastructure
- Vercel (Frontend deployment)
- Supabase (Database & Auth)
- OpenStreetMap + Leaflet (Geolocation and Mapping)
- Google Gemini (AI categorization)

## Project Structure

```
resolve-ai/
├── frontend/                 # React Vite app
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Layout wrappers
│   │   ├── context/         # React context
│   │   ├── routes/          # Route guards
│   │   ├── services/        # API services
│   │   ├── config/          # Configuration
│   │   └── utils/           # Utilities
│   └── index.html
├── backend/                 # Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utilities
│   │   └── server.js        # Entry point
│   └── database/
│       └── schema.sql       # Database schema
└── package.json            # Monorepo configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account (free tier works)
- Google API keys (Gemini & Maps - optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd resolve-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Frontend (`.env.local` in frontend directory):
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Backend (`.env` in backend directory):
   ```
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   CLIENT_URL=http://localhost:5173
   ```

4. **Set up Supabase database**
   - Create a Supabase project
   - Go to SQL Editor and run `backend/database/schema.sql`
   - See `backend/database/README.md` for detailed setup

5. **Run development servers**

   Terminal 1 - Frontend:
   ```bash
   pnpm dev:frontend
   ```

   Terminal 2 - Backend:
   ```bash
   pnpm dev:backend
   ```

   Or run both together:
   ```bash
   pnpm dev:all
   ```

6. **Open in browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## Database Schema

### Core Tables
- **users** - Extended from Supabase auth.users with profile data
- **issues** - Civic issue reports with status, priority, and location
- **comments** - Discussion on issues
- **issue_votes** - Upvotes/downvotes on issues
- **activity_logs** - Audit trail of issue status changes
- **notifications** - User notifications

See `backend/database/schema.sql` for complete schema with RLS policies.

## API Endpoints

### Health
- `GET /api/health` - Server status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user

### Issues
- `GET /api/issues` - List all issues (with filters)
- `GET /api/issues/:id` - Get issue details
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `POST /api/issues/:id/upvote` - Upvote issue
- `DELETE /api/issues/:id` - Delete issue

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/metrics` - Community metrics
- `GET /api/dashboard/heatmap` - Issue location heatmap

## Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Supabase returns session with JWT token
3. Frontend stores JWT in memory + refresh token in secure cookie
4. API client automatically attaches JWT to requests
5. Backend validates JWT and enforces RLS policies
6. Role-based access control: citizen, moderator, admin

## Role Permissions

- **Citizen** - Report issues, upvote, comment
- **Moderator** - Above + verify/prioritize issues
- **Admin** - Full access, user management, moderation

## Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy: `vercel deploy`
4. Domain configured automatically

### Backend (Vercel, Railway, or self-hosted)

#### Vercel
1. Create `vercel.json`:
   ```json
   {
     "buildCommand": "cd backend && npm install",
     "outputDirectory": "backend",
     "functions": {
       "backend/src/server.js": { "runtime": "nodejs18.x" }
     }
   }
   ```

2. Deploy: `vercel deploy --prod`

#### Railway
1. Connect GitHub
2. Select backend directory
3. Set environment variables
4. Auto-deploy on push

#### Self-hosted (VPS/EC2)
```bash
# SSH into server
ssh user@server.ip

# Clone repo
git clone <repo-url>
cd resolve-ai/backend

# Install and run
npm install
NODE_ENV=production npm start
```

## Testing

### Manual Testing
1. Sign up for new account
2. Report an issue with photo and location
3. Browse community issues
4. Upvote/comment on issues
5. View dashboard stats
6. (Admin) Access moderation panel

### Backend Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Get all issues
curl http://localhost:5000/api/issues

# Create issue
curl -X POST http://localhost:5000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test pothole",
    "description": "Test description",
    "category": "pothole",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

## Performance Optimization

- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Connection pooling, database indexes, response caching
- **Database**: Indexed queries, RLS policies, PostGIS spatial indexes
- **Deployment**: CDN for static assets, auto-scaling

## Security

- Supabase RLS for row-level database access control
- JWT token validation on backend
- CORS enabled only for frontend origin
- Helmet.js for security headers
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

## Future Enhancements

- **Real-time Updates** - WebSocket for live issue status changes
- **Mobile App** - React Native iOS/Android
- **Advanced Analytics** - Predictive maintenance, trend analysis
- **Social Features** - User profiles, achievement badges
- **Integration** - Slack notifications, email alerts
- **Accessibility** - WCAG 2.1 AA compliance

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am "Add feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Submit pull request

## License

MIT - See LICENSE file

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@resolveai.com

## Acknowledgments

Built with ❤️ for community-driven civic engagement.

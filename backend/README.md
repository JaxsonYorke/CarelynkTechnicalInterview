# Carelynk Backend API

A Node.js/TypeScript microservice backend for the Carelynk homecare onboarding and matching platform, connected to Supabase PostgreSQL.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.ts       # Environment variables validation
│   │   └── logger.ts    # Winston logger setup
│   ├── db/
│   │   ├── connection.ts         # Database connection management
│   │   ├── migrate.ts            # Migration runner
│   │   ├── migrations/           # SQL migration files
│   │   └── repositories/         # Data access layer
│   │       ├── userRepository.ts
│   │       ├── caregiverProfileRepository.ts
│   │       ├── careSeekerProfileRepository.ts
│   │       ├── careRequestRepository.ts
│   │       └── matchRepository.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   └── errorHandler.ts
│   ├── services/        # Business logic (to be implemented)
│   ├── routes/          # API route definitions (to be implemented)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app factory
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript output
├── logs/                # Application logs
├── .env                 # Environment variables (local)
├── .env.example         # Environment variables template
├── .eslintrc.json       # ESLint configuration
├── nodemon.json         # Nodemon configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Prerequisites

- Node.js 18+ (v23.2.0 tested)
- npm 10+
- PostgreSQL database (Supabase recommended)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure .env with your database connection:**
   ```
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:password@host:port/carelynk
   JWT_SECRET=your-secret-key-minimum-32-characters
   JWT_EXPIRE=7d
   BCRYPT_ROUNDS=10
   LOG_LEVEL=debug
   ```

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` and automatically reload on file changes.

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

## Database

### Schema Overview

The database includes the following tables:

#### users
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) - Unique email address
- `password_hash`: VARCHAR(255) - Bcrypt hashed password
- `role`: VARCHAR(20) - Either 'caregiver' or 'care_seeker'
- `created_at`: TIMESTAMP

#### caregiver_profiles
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to users)
- `name`: VARCHAR(100)
- `contact_info`: VARCHAR(255)
- `location`: VARCHAR(100)
- `skills`: TEXT[] - Array of skills
- `experience`: TEXT - Optional experience description
- `availability`: TEXT - Availability description
- `qualifications`: TEXT - Optional certifications
- `created_at`: TIMESTAMP

#### care_seeker_profiles
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to users)
- `name`: VARCHAR(100)
- `contact_info`: VARCHAR(255)
- `location`: VARCHAR(100)
- `created_at`: TIMESTAMP

#### care_requests
- `id`: UUID (Primary Key)
- `care_seeker_id`: UUID (Foreign Key to care_seeker_profiles)
- `care_type`: VARCHAR(100)
- `service_location`: VARCHAR(100)
- `schedule`: TEXT
- `duration`: VARCHAR(50) - Optional
- `preferences`: TEXT - Optional
- `created_at`: TIMESTAMP

#### matches
- `id`: UUID (Primary Key)
- `care_request_id`: UUID (Foreign Key to care_requests)
- `caregiver_id`: UUID (Foreign Key to caregiver_profiles)
- `matched_at`: TIMESTAMP

### Running Migrations

Migrations are automatically run on server startup. They are located in `src/db/migrations/`.

To manually run migrations, the server will execute them during initialization.

## Architecture

### Technology Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via postgres npm package)
- **Authentication:** JWT with Bcrypt for password hashing
- **Validation:** Zod for runtime type validation
- **Logging:** Winston
- **Security:** Helmet for HTTP headers, CORS support

### Key Design Patterns

1. **Repository Pattern:** Data access is abstracted into repository functions
2. **Service Layer:** Business logic is separated from controllers
3. **Middleware:** JWT auth and error handling via Express middleware
4. **Error Handling:** Custom AppError classes with consistent error responses
5. **Type Safety:** Full TypeScript coverage with strict mode enabled

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/caregiver/signup` - Caregiver registration
- `POST /api/auth/caregiver/login` - Caregiver login
- `POST /api/auth/seeker/signup` - Care seeker registration
- `POST /api/auth/seeker/login` - Care seeker login

### Caregiver Routes
- `GET /api/caregivers/profile` - Get caregiver profile
- `POST /api/caregivers/profile` - Create caregiver profile
- `PUT /api/caregivers/profile` - Update caregiver profile

### Care Seeker Routes
- `GET /api/seekers/profile` - Get care seeker profile
- `POST /api/seekers/profile` - Create care seeker profile
- `PUT /api/seekers/profile` - Update care seeker profile
- `POST /api/jobs` - Create care request
- `GET /api/jobs/:id/matches` - Get matched caregivers for a job

### Health Check
- `GET /health` - Server health check
- `GET /api/version` - API version

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | Yes | development | Environment mode |
| PORT | No | 3000 | Server port |
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| JWT_SECRET | Yes | - | Secret for JWT signing (min 32 chars) |
| JWT_EXPIRE | No | 7d | JWT expiration time |
| BCRYPT_ROUNDS | No | 10 | Bcrypt hashing rounds |
| LOG_LEVEL | No | info | Winston log level |

### Logging

Logs are written to:
- Console (all levels, colorized in development)
- `logs/all.log` (all log entries)
- `logs/error.log` (errors only)

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": "Optional additional info"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Testing

The foundation is set for integration with testing frameworks. Tests should be placed in `src/**/*.test.ts` files.

## Docker Support

A Dockerfile and docker-compose configuration should be added to run the backend and PostgreSQL locally.

## Deployment

For production deployment:

1. Build the project: `npm run build`
2. Set production environment variables
3. Run: `npm start`

Ensure:
- DATABASE_URL points to production database
- JWT_SECRET is strong and securely managed
- LOG_LEVEL is set to 'warn' or 'error'
- NODE_ENV is set to 'production'

## Next Steps

The foundation is complete. Next phases include:

1. **Phase 3:** Implement authentication service and endpoints
2. **Phase 4:** Build caregiver and care seeker API endpoints
3. **Phase 5:** Implement matching algorithm
4. **Phase 6:** Add error handling and validation
5. **Phase 7:** Docker setup
6. **Phase 8:** API documentation

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check database credentials
- Ensure PostgreSQL is running

### TypeScript Compilation Errors
- Run `npm install` to ensure all types are installed
- Check tsconfig.json is in the root directory

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

## License

ISC

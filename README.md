# API Gateway Pro

An intelligent API proxy and key management system that provides unified API call management, smart key rotation, automatic failure detection, and dynamic parameter generation.

## Features

- 🔑 **Key Pool Management**: Manage multiple API keys with automatic rotation and failover
- 🛡️ **Smart Protection**: Automatically detect key failures, quota exhaustion, and bans
- ⚙️ **Flexible Configuration**: Support custom request headers and scripted parameter generation
- 📊 **Observability**: Real-time monitoring of API call status and statistical analysis
- 🔄 **Automation**: Automatic key disable/enable and quota reset

## Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── requirements.txt    # Python dependencies
│   └── run.sh             # Backend startup script
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages (App Router)
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript types
│   ├── package.json      # Node dependencies
│   └── tsconfig.json     # TypeScript config
│
└── docs/                  # Documentation
    └── api-gateway-pro-prd-v1.md
```

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: SQLAlchemy 2.0
- **Async**: asyncio + httpx
- **Task Scheduling**: APScheduler
- **Script Execution**: py-mini-racer

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Charts**: Recharts
- **HTTP Client**: Axios

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from example:
```bash
cp .env.example .env
```

5. Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or simply run:
```bash
./run.sh
```

The backend API will be available at http://localhost:8000

API documentation: http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at http://localhost:3000

## API Endpoints

### Admin API (`/api/admin`)

- **Upstreams**: `/upstreams` - Manage upstream API configurations
- **API Keys**: `/keys` - Manage API keys
- **Headers**: `/headers` - Configure custom request headers
- **Rules**: `/rules` - Configure failure detection rules
- **Logs**: `/logs` - View request logs
- **Dashboard**: `/dashboard` - Dashboard statistics

Full API documentation is available at http://localhost:8000/docs after starting the backend.

## Development

### Backend Development

The backend uses FastAPI with automatic code reloading. Any changes to Python files will automatically restart the server.

### Frontend Development

The frontend uses Next.js with hot module replacement. Changes will be reflected immediately in the browser.

## Database

The project uses SQLite by default for development. The database file (`api_gateway.db`) will be created automatically in the backend directory on first run.

For production, consider using PostgreSQL. Update the `DATABASE_URL` in the `.env` file:

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/api_gateway_pro
```

## Configuration

Backend configuration is managed through environment variables. See `backend/.env.example` for available options.

Key settings:
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: Secret key for JWT tokens
- `CORS_ORIGINS`: Allowed CORS origins
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

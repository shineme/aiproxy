# Quick Reference

## 🚀 Quick Start Commands

### Backend
```bash
# Setup and start
cd backend && ./run.sh

# Manual start
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Install and start
cd frontend
npm install
npm run dev
```

### Docker
```bash
# Start everything
docker-compose up

# Start in background
docker-compose up -d

# Stop everything
docker-compose down
```

## 📍 URLs

- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Frontend**: http://localhost:3000

## 🗂️ Project Structure

```
api-gateway-pro/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── api/         # API route handlers
│   │   ├── core/        # Config & database
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── main.py      # App entry point
│   └── requirements.txt
│
├── frontend/            # Next.js TypeScript frontend
│   ├── src/
│   │   ├── app/        # Pages (App Router)
│   │   ├── components/ # React components
│   │   ├── lib/        # Utils & API client
│   │   └── types/      # TypeScript types
│   └── package.json
│
└── docs/               # Documentation
```

## 🔧 Common Commands

### Backend

```bash
# Install dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run tests (when implemented)
pytest

# Reset database
rm backend/api_gateway.db
# Then restart server

# Add new dependency
pip install package-name
pip freeze > requirements.txt
```

### Frontend

```bash
# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Add new dependency
npm install package-name
```

## 📊 Database Models

| Model | Description |
|-------|-------------|
| `Upstream` | Upstream API configurations |
| `APIKey` | API keys with quota & status |
| `HeaderConfig` | Custom request headers |
| `Rule` | Failure detection rules |
| `RequestLog` | Request/response logs |

## 🌐 API Endpoints

### Admin API (prefix: `/api/admin`)

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Upstreams | `/upstreams` | GET, POST |
| | `/upstreams/:id` | GET, PUT, DELETE |
| API Keys | `/keys` | GET, POST |
| | `/keys/:id` | GET, PUT, DELETE |
| | `/keys/:id/enable` | POST |
| | `/keys/:id/disable` | POST |
| Headers | `/headers` | GET, POST |
| | `/headers/:id` | GET, PUT, DELETE |
| Rules | `/rules` | GET, POST |
| | `/rules/:id` | GET, PUT, DELETE |
| Logs | `/logs` | GET |
| | `/logs/:id` | GET |
| | `/logs/stats/summary` | GET |
| Dashboard | `/dashboard/stats` | GET |
| | `/dashboard/realtime` | GET |

## 🎨 Frontend Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **State**: Zustand
- **HTTP**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

## 🐍 Backend Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.10+
- **Database**: SQLite → PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic
- **Async**: asyncio + httpx
- **Scheduler**: APScheduler
- **Scripts**: py-mini-racer

## 🔐 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=sqlite+aiosqlite:///./api_gateway.db
SECRET_KEY=your-secret-key-here
ENABLE_AUTH=false
LOG_LEVEL=INFO
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🐛 Troubleshooting

### Port in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module not found (Backend)
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Module not found (Frontend)
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database locked
```bash
# Stop all processes using the database
# Delete and recreate
rm backend/api_gateway.db
# Restart backend server
```

### CORS errors
Check `backend/app/core/config.py`:
```python
CORS_ORIGINS = ["http://localhost:3000"]
```

## 📚 Documentation Files

- `README.md` - Project overview & quick start
- `GETTING_STARTED.md` - Detailed setup guide
- `DEVELOPMENT.md` - Architecture & dev guide
- `CHANGELOG.md` - Version history
- `QUICKREF.md` - This file!
- `docs/api-gateway-pro-prd-v1.md` - Product requirements

## 🔄 Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "feat: your feature description"

# Push
git push origin chore/start-development
```

## ⚡ Pro Tips

1. **Hot Reload**: Both backend and frontend support hot reload during development
2. **API Testing**: Use http://localhost:8000/docs for interactive API testing
3. **Type Safety**: Frontend API client is fully typed - use TypeScript autocomplete
4. **Database**: SQLite file is at `backend/api_gateway.db` - can open with DB Browser
5. **Logs**: Backend logs to console, check terminal for errors
6. **Docker**: Use for production-like environment testing

## 📞 Getting Help

1. Check this quick reference
2. Read `GETTING_STARTED.md` for setup issues
3. Read `DEVELOPMENT.md` for development questions
4. Check API docs at http://localhost:8000/docs
5. Review the PRD at `docs/api-gateway-pro-prd-v1.md`

---

**Current Status**: ✅ Project foundation complete and ready for feature development

**Next Phase**: Implement core proxy and key management features (Phase 1, Week 2)

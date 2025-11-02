# Development Guide

This document provides detailed information for developers working on API Gateway Pro.

## Architecture Overview

### Backend Architecture (FastAPI)

```
┌─────────────────────────────────────────┐
│          FastAPI Application            │
├─────────────────────────────────────────┤
│  Routes Layer (app/api/)                │
│  - upstreams.py                         │
│  - api_keys.py                          │
│  - header_configs.py                    │
│  - rules.py                             │
│  - request_logs.py                      │
│  - dashboard.py                         │
├─────────────────────────────────────────┤
│  Business Logic (app/services/)         │
│  - To be implemented                    │
├─────────────────────────────────────────┤
│  Data Access Layer                      │
│  - Models (SQLAlchemy)                  │
│  - Schemas (Pydantic)                   │
├─────────────────────────────────────────┤
│  Database (SQLite/PostgreSQL)           │
└─────────────────────────────────────────┘
```

### Frontend Architecture (Next.js)

```
┌─────────────────────────────────────────┐
│        Next.js Application              │
├─────────────────────────────────────────┤
│  Pages (App Router)                     │
│  - page.tsx (landing)                   │
│  - dashboard/                           │
│  - upstreams/                           │
│  - keys/                                │
├─────────────────────────────────────────┤
│  Components Layer                       │
│  - Reusable UI components               │
│  - Layout components                    │
├─────────────────────────────────────────┤
│  State Management                       │
│  - Zustand stores                       │
│  - React Context                        │
├─────────────────────────────────────────┤
│  API Client (lib/api.ts)                │
│  - Axios wrapper                        │
│  - API endpoints                        │
└─────────────────────────────────────────┘
```

## Database Schema

### Core Tables

1. **upstreams**: Upstream API configurations
   - Basic info: name, base_url, description
   - Proxy settings: timeout, retry_count, connection_pool_size
   - Logging options: log_request_body, log_response_body

2. **api_keys**: API key management
   - Key info: key_value, name
   - Location: header/query/body
   - Quota: enable_quota, quota_total, quota_used
   - Status: active/disabled/banned

3. **header_configs**: Custom request headers
   - Header name and value
   - Value type: static/javascript/python
   - Script content for dynamic values
   - Priority and timeout settings

4. **rules**: Failure detection rules
   - Conditions (JSON): status_code, response_body, etc.
   - Actions: disable_key, ban_key, alert, log
   - Thresholds and time windows

5. **request_logs**: Request/response logging
   - Request details: method, path, headers, body
   - Response details: status_code, headers, body, latency_ms
   - Metadata: client_ip, error_message, triggered_rules

### Relationships

```
Upstream (1) ─── (N) APIKey
Upstream (1) ─── (N) HeaderConfig
Upstream (1) ─── (N) Rule
Upstream (1) ─── (N) RequestLog
APIKey (1) ─── (N) RequestLog
```

## API Endpoints

### Base URL
- Development: `http://localhost:8000`
- API Prefix: `/api/admin`

### Upstreams
```
GET    /api/admin/upstreams          # List all upstreams
POST   /api/admin/upstreams          # Create upstream
GET    /api/admin/upstreams/:id      # Get upstream details
PUT    /api/admin/upstreams/:id      # Update upstream
DELETE /api/admin/upstreams/:id      # Delete upstream
```

### API Keys
```
GET    /api/admin/keys               # List all keys
POST   /api/admin/keys               # Create key
GET    /api/admin/keys/:id           # Get key details
PUT    /api/admin/keys/:id           # Update key
DELETE /api/admin/keys/:id           # Delete key
POST   /api/admin/keys/:id/enable    # Enable key
POST   /api/admin/keys/:id/disable   # Disable key
```

### Header Configs
```
GET    /api/admin/headers            # List all header configs
POST   /api/admin/headers            # Create header config
GET    /api/admin/headers/:id        # Get header config details
PUT    /api/admin/headers/:id        # Update header config
DELETE /api/admin/headers/:id        # Delete header config
```

### Rules
```
GET    /api/admin/rules              # List all rules
POST   /api/admin/rules              # Create rule
GET    /api/admin/rules/:id          # Get rule details
PUT    /api/admin/rules/:id          # Update rule
DELETE /api/admin/rules/:id          # Delete rule
```

### Request Logs
```
GET    /api/admin/logs               # List logs
GET    /api/admin/logs/:id           # Get log details
GET    /api/admin/logs/stats/summary # Get statistics
```

### Dashboard
```
GET    /api/admin/dashboard/stats    # Dashboard statistics
GET    /api/admin/dashboard/realtime # Realtime data
```

## Development Workflow

### Adding a New Feature

#### Backend

1. **Create/Update Model** (`backend/app/models/`)
   ```python
   from sqlalchemy import Column, Integer, String
   from app.core.database import Base
   
   class YourModel(Base):
       __tablename__ = "your_table"
       id = Column(Integer, primary_key=True)
       name = Column(String(255), nullable=False)
   ```

2. **Create Pydantic Schemas** (`backend/app/schemas/`)
   ```python
   from pydantic import BaseModel
   
   class YourModelCreate(BaseModel):
       name: str
   
   class YourModelResponse(YourModelCreate):
       id: int
       
       class Config:
           from_attributes = True
   ```

3. **Create API Routes** (`backend/app/api/`)
   ```python
   from fastapi import APIRouter, Depends
   from sqlalchemy.ext.asyncio import AsyncSession
   
   router = APIRouter()
   
   @router.get("")
   async def list_items(db: AsyncSession = Depends(get_db)):
       # Implementation
       pass
   ```

4. **Register Router** (`backend/app/main.py`)
   ```python
   from app.api import your_module
   
   app.include_router(
       your_module.router,
       prefix=f"{settings.API_V1_STR}/your-endpoint",
       tags=["your-tag"]
   )
   ```

#### Frontend

1. **Add API Client Methods** (`frontend/src/lib/api.ts`)
   ```typescript
   export const yourApi = {
     list: () => apiClient.get('/api/admin/your-endpoint'),
     create: (data: any) => apiClient.post('/api/admin/your-endpoint', data),
   }
   ```

2. **Create TypeScript Types** (`frontend/src/types/index.ts`)
   ```typescript
   export interface YourType {
     id: number
     name: string
   }
   ```

3. **Create Page** (`frontend/src/app/your-page/page.tsx`)
   ```typescript
   export default function YourPage() {
     return <div>Your page content</div>
   }
   ```

## Testing

### Backend Testing

```bash
cd backend

# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app tests/

# Run specific test
python -m pytest tests/test_upstreams.py
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Code Style

### Python (Backend)

- Use type hints for all function parameters and return values
- Follow PEP 8 style guide
- Use async/await for database operations
- Use Pydantic for data validation

Example:
```python
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

async def get_items(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[Item]:
    result = await db.execute(
        select(Item).offset(skip).limit(limit)
    )
    return result.scalars().all()
```

### TypeScript (Frontend)

- Use functional components with hooks
- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind for styling

Example:
```typescript
interface Props {
  title: string
  onSubmit: (data: FormData) => void
}

export function Component({ title, onSubmit }: Props) {
  const [data, setData] = useState<FormData>()
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  )
}
```

## Environment Variables

### Backend (.env)

```bash
# Application
PROJECT_NAME="API Gateway Pro"
VERSION="1.0.0"
API_V1_STR="/api/admin"

# Database
DATABASE_URL="sqlite+aiosqlite:///./api_gateway.db"

# Security
SECRET_KEY="your-secret-key"
ENABLE_AUTH=false

# Logging
LOG_LEVEL="INFO"
LOG_RETENTION_DAYS=30
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Debugging

### Backend

1. **Enable Debug Logging**
   ```python
   # In config.py
   LOG_LEVEL = "DEBUG"
   ```

2. **Use FastAPI's Interactive Docs**
   - Visit http://localhost:8000/docs
   - Test endpoints directly

3. **Use Python Debugger**
   ```python
   import pdb; pdb.set_trace()
   ```

### Frontend

1. **Use Browser DevTools**
   - Console: `console.log()`
   - Network tab: Check API requests
   - React DevTools: Inspect components

2. **Enable Next.js Debug Mode**
   ```bash
   NODE_OPTIONS='--inspect' npm run dev
   ```

## Common Tasks

### Reset Database

```bash
cd backend
rm api_gateway.db
# Restart the server to recreate the database
```

### Add a New Python Dependency

```bash
cd backend
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
```

### Add a New npm Package

```bash
cd frontend
npm install package-name
```

## Performance Optimization

### Backend

- Use async/await for I/O operations
- Implement connection pooling for database
- Add caching for frequently accessed data
- Use pagination for large datasets

### Frontend

- Implement lazy loading for components
- Use React.memo for expensive components
- Optimize images and assets
- Implement virtual scrolling for long lists

## Security Considerations

### Backend

- Validate all inputs with Pydantic
- Use parameterized queries (SQLAlchemy handles this)
- Implement rate limiting
- Add authentication when ENABLE_AUTH=true
- Encrypt sensitive data (API keys)

### Frontend

- Sanitize user inputs
- Implement CSRF protection
- Use HTTPS in production
- Don't expose sensitive data in client-side code

## Deployment

### Production Checklist

- [ ] Set strong SECRET_KEY
- [ ] Enable authentication (ENABLE_AUTH=true)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set LOG_LEVEL to INFO or WARNING
- [ ] Configure CORS origins properly
- [ ] Enable HTTPS
- [ ] Set up backup strategy
- [ ] Configure monitoring and alerting
- [ ] Optimize database indexes
- [ ] Set up CI/CD pipeline

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Troubleshooting

### Database Locked Error (SQLite)

**Cause**: Multiple processes trying to write to SQLite

**Solution**: Use PostgreSQL for production or enable WAL mode

### CORS Errors

**Cause**: Frontend origin not in CORS_ORIGINS

**Solution**: Add frontend URL to backend config

### Module Import Errors

**Cause**: Missing dependencies or incorrect paths

**Solution**: 
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Update documentation
5. Submit a pull request

For questions or issues, please open an issue on GitHub.

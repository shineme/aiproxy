# Getting Started with API Gateway Pro

This guide will help you set up and run the API Gateway Pro project for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10 or higher**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18 or higher**: [Download Node.js](https://nodejs.org/)
- **npm or yarn**: Comes with Node.js
- **Git**: [Download Git](https://git-scm.com/downloads)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd api-gateway-pro
```

### 2. Backend Setup

#### Option A: Using the run script (recommended)

```bash
cd backend
chmod +x run.sh
./run.sh
```

This script will:
- Create a Python virtual environment
- Install all dependencies
- Copy the environment configuration
- Start the FastAPI server

#### Option B: Manual setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install
# or if you prefer yarn:
# yarn install

# Start the development server
npm run dev
# or
# yarn dev
```

The frontend will be available at: http://localhost:3000

## Using Docker (Alternative)

If you prefer to use Docker:

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down
```

This will start both backend and frontend services:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## Verifying the Installation

### Backend Health Check

1. Open your browser and go to http://localhost:8000
2. You should see a JSON response:
   ```json
   {
     "name": "API Gateway Pro",
     "version": "1.0.0",
     "status": "running"
   }
   ```

3. Check the API documentation at http://localhost:8000/docs
4. You should see the interactive Swagger UI with all available endpoints

### Frontend Check

1. Open your browser and go to http://localhost:3000
2. You should see the API Gateway Pro landing page
3. Click on "Go to Dashboard" or "Manage APIs" to explore the interface

## Project Structure Overview

```
api-gateway-pro/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Core configuration and database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas for validation
│   │   └── main.py         # FastAPI application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment configuration
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript type definitions
│   └── package.json      # Node.js dependencies
│
└── docs/                  # Project documentation
```

## Development Workflow

### Backend Development

The backend uses FastAPI with hot-reload enabled. Any changes to Python files will automatically restart the server.

**Making changes:**
1. Edit files in `backend/app/`
2. The server will automatically reload
3. Test your changes at http://localhost:8000/docs

**Adding a new API endpoint:**
1. Create or edit a file in `backend/app/api/`
2. Define your route using FastAPI decorators
3. Add the router to `backend/app/main.py`

### Frontend Development

The frontend uses Next.js with hot module replacement (HMR). Changes are reflected immediately in the browser.

**Making changes:**
1. Edit files in `frontend/src/`
2. The browser will automatically update
3. Check the console for any errors

**Adding a new page:**
1. Create a new folder in `frontend/src/app/`
2. Add a `page.tsx` file in that folder
3. The route will be automatically available

## Database

The project uses SQLite for development. The database file `api_gateway.db` will be created automatically in the `backend/` directory on first run.

**Viewing the database:**
You can use any SQLite browser tool like:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLite Viewer VS Code Extension](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer)

## Common Issues

### Backend won't start

**Issue**: `ModuleNotFoundError` or import errors

**Solution**: Make sure you've activated the virtual environment and installed all dependencies:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend won't start

**Issue**: Module not found errors

**Solution**: Delete `node_modules` and reinstall:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use

**Issue**: Port 8000 or 3000 is already in use

**Solution**: 
- Find and stop the process using the port
- Or change the port in the configuration:
  - Backend: Add `--port 8001` to the uvicorn command
  - Frontend: Run `PORT=3001 npm run dev`

### CORS errors

**Issue**: Frontend can't connect to backend

**Solution**: Make sure both servers are running and check the CORS configuration in `backend/app/core/config.py`

## Next Steps

1. **Read the PRD**: Check `docs/api-gateway-pro-prd-v1.md` for detailed feature specifications
2. **Explore the API**: Use the interactive docs at http://localhost:8000/docs
3. **Start coding**: Pick a feature from the PRD and start implementing!

## Getting Help

If you encounter any issues:
1. Check this guide first
2. Look at the project documentation in the `docs/` folder
3. Check the API documentation at http://localhost:8000/docs
4. Review the code comments in the source files

Happy coding! 🚀

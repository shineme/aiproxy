from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api import upstreams, api_keys, header_configs, rules, request_logs, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upstreams.router, prefix=f"{settings.API_V1_STR}/upstreams", tags=["upstreams"])
app.include_router(api_keys.router, prefix=f"{settings.API_V1_STR}/keys", tags=["api-keys"])
app.include_router(header_configs.router, prefix=f"{settings.API_V1_STR}/headers", tags=["headers"])
app.include_router(rules.router, prefix=f"{settings.API_V1_STR}/rules", tags=["rules"])
app.include_router(request_logs.router, prefix=f"{settings.API_V1_STR}/logs", tags=["logs"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

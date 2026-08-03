"""Application entry point.

Run locally with:  uvicorn app.main:app --reload
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.exceptions import DomainError
from app.database.session import engine
from app.modules.ai.router import router as ai_router
from app.modules.analytics.router import router as analytics_router
from app.modules.auth.router import router as auth_router
from app.modules.availability.router import router as availability_router
from app.modules.billing.router import router as billing_router
from app.modules.bookings.router import router as bookings_router
from app.modules.guests.router import router as guests_router
from app.modules.organizations.router import router as organizations_router
from app.modules.properties.router import router as properties_router
from app.modules.users.router import router as users_router
from app.routers import health


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(DomainError, domain_error_handler)  # type: ignore[arg-type]

    # Health stays unversioned: load balancers and orchestrators probe it.
    app.include_router(health.router)

    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(users_router, prefix=settings.api_prefix)
    app.include_router(organizations_router, prefix=settings.api_prefix)
    app.include_router(properties_router, prefix=settings.api_prefix)
    app.include_router(guests_router, prefix=settings.api_prefix)
    app.include_router(bookings_router, prefix=settings.api_prefix)
    app.include_router(availability_router, prefix=settings.api_prefix)
    app.include_router(billing_router, prefix=settings.api_prefix)
    app.include_router(ai_router, prefix=settings.api_prefix)
    app.include_router(analytics_router, prefix=settings.api_prefix)

    return app


app = create_app()

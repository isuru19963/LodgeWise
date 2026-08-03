from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.modules.auth import service
from app.modules.auth.schemas import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.modules.users.schemas import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

DB = Annotated[AsyncSession, Depends(get_db)]


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, session: DB) -> AuthResponse:
    """Create an organization and its OWNER account, returning tokens."""
    user, tokens = await service.register(session, data)
    return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, session: DB) -> AuthResponse:
    user, tokens = await service.login(session, data.email, data.password)
    return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, session: DB) -> TokenPair:
    return await service.refresh(session, data.refresh_token)

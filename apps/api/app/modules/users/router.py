from fastapi import APIRouter, status

from app.models import UserRole
from app.modules.auth.dependencies import CurrentTenant, CurrentUser, TenantDB, require_role
from app.modules.users import service
from app.modules.users.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)


@router.get(
    "",
    response_model=list[UserResponse],
    dependencies=[require_role(UserRole.ADMIN)],
)
async def list_users(tenant: CurrentTenant, session: TenantDB) -> list[UserResponse]:
    users = await service.list_users(session, tenant)
    return [UserResponse.model_validate(u) for u in users]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_role(UserRole.ADMIN)],
)
async def create_user(
    data: UserCreate, tenant: CurrentTenant, session: TenantDB
) -> UserResponse:
    user = await service.create_user(session, tenant, data)
    return UserResponse.model_validate(user)

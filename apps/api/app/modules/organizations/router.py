from fastapi import APIRouter

from app.models import UserRole
from app.modules.auth.dependencies import CurrentTenant, TenantDB, require_role
from app.modules.organizations import service
from app.modules.organizations.schemas import OrganizationResponse, OrganizationUpdate

router = APIRouter(prefix="/organization", tags=["organization"])


@router.get("", response_model=OrganizationResponse)
async def get_organization(tenant: CurrentTenant, session: TenantDB) -> OrganizationResponse:
    organization = await service.get_organization(session, tenant)
    return OrganizationResponse.model_validate(organization)


@router.patch(
    "",
    response_model=OrganizationResponse,
    dependencies=[require_role(UserRole.ADMIN)],
)
async def update_organization(
    data: OrganizationUpdate, tenant: CurrentTenant, session: TenantDB
) -> OrganizationResponse:
    organization = await service.update_organization(session, tenant, data)
    return OrganizationResponse.model_validate(organization)

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import Organization
from app.modules.auth.dependencies import TenantContext
from app.modules.organizations.schemas import OrganizationUpdate


async def get_organization(session: AsyncSession, tenant: TenantContext) -> Organization:
    organization = await session.get(Organization, tenant.organization_id)
    if organization is None:
        raise NotFoundError("Organization not found")
    return organization


async def update_organization(
    session: AsyncSession, tenant: TenantContext, data: OrganizationUpdate
) -> Organization:
    organization = await get_organization(session, tenant)

    if data.name is not None:
        organization.name = data.name

    await session.commit()
    await session.refresh(organization)
    return organization

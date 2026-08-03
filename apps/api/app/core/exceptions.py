"""Domain exceptions, mapped to HTTP responses in one place (app.main).

Services raise these instead of HTTPException so the service layer stays
framework-free (clean architecture: dependencies point inward).
"""


class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


class UnauthorizedError(DomainError):
    status_code = 401


class ForbiddenError(DomainError):
    status_code = 403


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409

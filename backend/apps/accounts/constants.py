"""Ambientes ERP ativos no sistema."""

ADMIN_ENVIRONMENT = 'Administração/Manutenção'
LEGACY_ADMIN_ENVIRONMENT = 'Administração'

ACTIVE_ENVIRONMENTS = frozenset({ADMIN_ENVIRONMENT, 'Financeiro', 'Indicadores'})

DEPRECATED_ENVIRONMENTS = frozenset({'Comercial', 'Frota'})


def normalize_environment(env: str) -> str:
    if env == LEGACY_ADMIN_ENVIRONMENT:
        return ADMIN_ENVIRONMENT
    return env


def sanitize_environments(environments: list | None) -> list[str]:
    return [
        env
        for env in (normalize_environment(e) for e in (environments or []))
        if env in ACTIVE_ENVIRONMENTS
    ]


def sanitize_filiais(filiais: dict | None) -> dict[str, list]:
    return {
        module: branches
        for module, branches in (filiais or {}).items()
        if module in ACTIVE_ENVIRONMENTS
    }


def sanitize_permissions(permissions: list | None) -> list[str]:
    return [
        perm
        for perm in (normalize_environment(p) for p in (permissions or []))
        if perm in ACTIVE_ENVIRONMENTS
    ]

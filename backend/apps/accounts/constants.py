"""Ambientes ERP ativos no sistema."""

ACTIVE_ENVIRONMENTS = frozenset({'Administração', 'Financeiro', 'Indicadores'})

DEPRECATED_ENVIRONMENTS = frozenset({'Comercial', 'Frota'})


def sanitize_environments(environments: list | None) -> list[str]:
    return [env for env in (environments or []) if env in ACTIVE_ENVIRONMENTS]


def sanitize_filiais(filiais: dict | None) -> dict[str, list]:
    return {
        module: branches
        for module, branches in (filiais or {}).items()
        if module in ACTIVE_ENVIRONMENTS
    }


def sanitize_permissions(permissions: list | None) -> list[str]:
    return [perm for perm in (permissions or []) if perm in ACTIVE_ENVIRONMENTS]

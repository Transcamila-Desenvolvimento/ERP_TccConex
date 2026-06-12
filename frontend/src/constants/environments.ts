/** Ambientes ERP ativos no sistema. */
export const ADMIN_ENVIRONMENT = 'Administração/Manutenção' as const;
export const LEGACY_ADMIN_ENVIRONMENT = 'Administração' as const;

export const ACTIVE_ENVIRONMENTS = [ADMIN_ENVIRONMENT, 'Financeiro', 'Indicadores'] as const;

export type ActiveEnvironment = (typeof ACTIVE_ENVIRONMENTS)[number];

export function normalizeEnvironment(env: string): string {
  return env === LEGACY_ADMIN_ENVIRONMENT ? ADMIN_ENVIRONMENT : env;
}

export function filterActiveEnvironments(environments: string[] | undefined): ActiveEnvironment[] {
  const allowed = new Set<string>(ACTIVE_ENVIRONMENTS);
  return (environments ?? [])
    .map(normalizeEnvironment)
    .filter((env): env is ActiveEnvironment => allowed.has(env));
}

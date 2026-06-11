/** Ambientes ERP ativos no sistema. */
export const ACTIVE_ENVIRONMENTS = ['Administração', 'Financeiro', 'Indicadores'] as const;

export type ActiveEnvironment = (typeof ACTIVE_ENVIRONMENTS)[number];

export function filterActiveEnvironments(environments: string[] | undefined): ActiveEnvironment[] {
  const allowed = new Set<string>(ACTIVE_ENVIRONMENTS);
  return (environments ?? []).filter((env): env is ActiveEnvironment => allowed.has(env));
}

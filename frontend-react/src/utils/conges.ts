//  utilitaire pour désactiver les boutons aprè délais
export function isDecisionLocked(
  date_validation: string | null,
  lockMinutes = 15
): boolean {
  if (!date_validation) return false;
  const validatedAt = new Date(date_validation).getTime();
  const now = Date.now();
  const lockAfter = validatedAt + lockMinutes * 60_000;
  return now >= lockAfter;
}

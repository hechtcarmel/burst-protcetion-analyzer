export function escapeValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Invalid number value');
    }
    return String(value);
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

export function buildWhereClause(conditions: string[]): string {
  const filtered = conditions.filter(Boolean);
  return filtered.length > 0 ? `WHERE ${filtered.join(' AND ')}` : '';
}

export function buildFilterCondition(
  column: string,
  value: string | number | null | undefined,
  operator: '=' | '>' | '<' | '>=' | '<=' | 'BETWEEN' = '='
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (operator === 'BETWEEN') {
    throw new Error('BETWEEN operator requires special handling');
  }

  return `${column} ${operator} ${escapeValue(value)}`;
}

export function buildDateRangeCondition(
  column: string,
  startDate?: string,
  endDate?: string
): string {
  if (!startDate || !endDate) {
    return '';
  }

  // To make the end date inclusive of the entire day, we add one day and use < instead of <=
  // This ensures that '2025-10-24' includes all of 2025-10-24 23:59:59.999
  return `${column} >= ${escapeValue(startDate)} AND ${column} < (${escapeValue(endDate)}::date + interval '1 day')`;
}

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

  return `${column} BETWEEN ${escapeValue(startDate)} AND ${escapeValue(endDate)}`;
}

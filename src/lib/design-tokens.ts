export const designTokens = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  colors: {
    semantic: {
      success: 'hsl(var(--success))',
      warning: 'hsl(var(--warning))',
      danger: 'hsl(var(--danger))',
      info: 'hsl(var(--info))',
      purple: 'hsl(var(--purple))',
    },
  },
} as const;

export const metricCardVariants = {
  accounts: {
    gradient: 'from-slate-50 to-slate-100/50',
    darkGradient: 'dark:from-slate-900/50 dark:to-slate-800/30',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
  depletion: {
    gradient: 'from-blue-50 to-purple-50/50',
    darkGradient: 'dark:from-blue-950/50 dark:to-purple-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  spikes: {
    gradient: 'from-amber-50 to-orange-50/50',
    darkGradient: 'dark:from-amber-950/50 dark:to-orange-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  blocking: {
    gradient: 'from-emerald-50 to-teal-50/50',
    darkGradient: 'dark:from-emerald-950/50 dark:to-teal-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
} as const;

export type MetricCardVariant = keyof typeof metricCardVariants;

'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendIndicator, type TrendDirection } from './TrendIndicator';
import { CardSkeleton } from '@/components/loading/CardSkeleton';
import { cn } from '@/lib/utils';
import type { MetricCardVariant } from '@/lib/design-tokens';
import { metricCardVariants } from '@/lib/design-tokens';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendDirection;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: MetricCardVariant;
  index?: number;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  loading,
  variant = 'accounts',
  index = 0,
}: MetricCardProps) {
  if (loading) {
    return <CardSkeleton />;
  }

  const variantStyles = metricCardVariants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className={cn(
        "relative overflow-hidden group transition-shadow duration-300 hover:shadow-lg h-full",
        "before:absolute before:inset-0 before:bg-gradient-to-br",
        `before:${variantStyles.gradient}`,
        `before:${variantStyles.darkGradient}`,
        "before:opacity-50"
      )}>
        <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          {icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              className={cn(
                "p-3 rounded-full transition-transform duration-300 group-hover:scale-110",
                variantStyles.iconBg
              )}
            >
              <div className={variantStyles.iconColor}>
                {icon}
              </div>
            </motion.div>
          )}
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-baseline gap-2 mb-2">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              className="text-3xl font-bold tabular-nums"
            >
              {value}
            </motion.div>
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
              >
                <TrendIndicator trend={trend} />
              </motion.div>
            )}
          </div>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.6 }}
              className="text-xs text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </CardContent>

        {/* Bottom accent bar */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60 transition-opacity duration-300 group-hover:opacity-100",
          variant === 'accounts' && "from-slate-400 to-slate-600",
          variant === 'depletion' && "from-blue-400 to-purple-600",
          variant === 'spikes' && "from-amber-400 to-orange-600",
          variant === 'blocking' && "from-emerald-400 to-teal-600"
        )} />
      </Card>
    </motion.div>
  );
}

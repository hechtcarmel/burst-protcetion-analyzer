import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'stable';

interface TrendIndicatorProps {
  trend: TrendDirection;
  className?: string;
}

export function TrendIndicator({ trend, className = 'h-4 w-4' }: TrendIndicatorProps) {
  if (trend === 'up') {
    return <TrendingUp className={`text-green-600 ${className}`} />;
  }
  if (trend === 'down') {
    return <TrendingDown className={`text-red-600 ${className}`} />;
  }
  return <Minus className={`text-gray-500 ${className}`} />;
}

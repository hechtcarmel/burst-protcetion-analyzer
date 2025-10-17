import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="absolute inset-0 skeleton-shimmer" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
    </Card>
  );
}

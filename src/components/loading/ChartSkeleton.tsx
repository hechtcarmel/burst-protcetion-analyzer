import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="w-full" style={{ height: `${height}px` }} />
    </Card>
  );
}

import { Search, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
          <div className="relative bg-primary/5 p-6 rounded-full">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold">Select an Advertiser to Begin</h3>
          <p className="text-muted-foreground">
            Choose one or more advertisers from the filter above to view their burst protection analytics,
            depletion rates, and spike detection data.
          </p>
        </div>

        <div className="flex items-center gap-8 pt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Real-time metrics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-current" />
            <span>Multi-select support</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

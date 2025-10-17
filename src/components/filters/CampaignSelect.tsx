'use client';

import { useCampaigns } from '@/lib/hooks/useCampaigns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CampaignSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  advertiserId: number | null;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export default function CampaignSelect({
  value,
  onChange,
  advertiserId,
  dateRange
}: CampaignSelectProps) {
  const { data, isLoading, error } = useCampaigns({
    advertiserId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const campaigns = data?.campaigns || [];
  const selectedCampaign = campaigns.find((c) => c.id === value);

  const handleValueChange = (val: string) => {
    if (val === 'all') {
      onChange(null);
    } else {
      onChange(Number(val));
    }
  };

  // If a campaign is selected but not in the list (e.g., advertiser changed), reset it
  if (value && campaigns.length > 0 && !selectedCampaign) {
    onChange(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading campaigns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 border rounded-md bg-destructive/10 text-destructive text-sm">
        Error loading campaigns
      </div>
    );
  }

  const isDisabled = !advertiserId;

  return (
    <Select
      value={value ? String(value) : 'all'}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder={isDisabled ? "Select an advertiser first" : "Select a campaign"}>
          {isDisabled
            ? "Select an advertiser first"
            : selectedCampaign
              ? selectedCampaign.name
              : `All Campaigns${campaigns.length > 0 ? ` (${campaigns.length})` : ''}`
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          All Campaigns{campaigns.length > 0 ? ` (${campaigns.length})` : ''}
        </SelectItem>
        {campaigns.map((campaign) => (
          <SelectItem key={campaign.id} value={String(campaign.id)}>
            {campaign.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

'use client';

import { useAdvertisers } from '@/lib/hooks/useAdvertisers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AdvertiserSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
}

export default function AdvertiserSelect({ value, onChange }: AdvertiserSelectProps) {
  const { data, isLoading } = useAdvertisers();

  const advertisers = data?.advertisers || [];
  const selectedAdvertiser = advertisers.find((a) => a.id === value);

  const handleValueChange = (val: string) => {
    if (val === 'all') {
      onChange(null);
    } else {
      onChange(Number(val));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading advertisers...</span>
      </div>
    );
  }

  return (
    <Select
      value={value ? String(value) : 'all'}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select an advertiser">
          {selectedAdvertiser ? selectedAdvertiser.description : 'All Advertisers'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Advertisers</SelectItem>
        {advertisers.map((advertiser) => (
          <SelectItem key={advertiser.id} value={String(advertiser.id)}>
            {advertiser.description}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

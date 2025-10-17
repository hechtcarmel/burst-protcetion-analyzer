'use client';

import { format } from 'date-fns';

interface FeatureDateIndicatorProps {
  featureDate: Date | string;
}

export function FeatureDateIndicator({ featureDate }: FeatureDateIndicatorProps) {
  const featureDateLabel = format(
    typeof featureDate === 'string' ? new Date(featureDate) : featureDate,
    'MMM dd, yyyy'
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border-l-4 border-emerald-500 rounded-r w-fit">
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-emerald-700">Feature Enabled</p>
          <p className="text-xs text-emerald-600">{featureDateLabel}</p>
        </div>
      </div>
    </div>
  );
}

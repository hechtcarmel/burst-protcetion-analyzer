'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  error: Error;
  onRetry?: () => void;
}

export default function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20 animate-slide-in">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Error Loading Data
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {error.message}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

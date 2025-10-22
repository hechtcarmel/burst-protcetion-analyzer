'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import type { CampaignWindow, WindowRow } from '@/types/window';

interface TooltipData {
  window: WindowRow;
  campaignName: string;
  mouseX: number;
  mouseY: number;
}

interface WindowTimelineChartProps {
  data: CampaignWindow[];
  height?: number;
}

export default function WindowTimelineChart({
  data,
  height = 600,
}: WindowTimelineChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [xAxisRange, setXAxisRange] = useState<[number, number]>([0, 100]);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.totalWindows - a.totalWindows);
  }, [data]);

  const { minTime, maxTime, timeRange, fullMinTime, fullMaxTime, fullTimeRange } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    data.forEach(campaign => {
      campaign.windows.forEach(window => {
        // Ensure dates are Date objects
        const startTime = window.start_time instanceof Date
          ? window.start_time.getTime()
          : new Date(window.start_time).getTime();
        const endTime = window.end_time instanceof Date
          ? window.end_time.getTime()
          : new Date(window.end_time).getTime();
        if (startTime < min) min = startTime;
        if (endTime > max) max = endTime;
      });
    });

    const fullRange = max - min;
    const visibleMin = min + (fullRange * xAxisRange[0]) / 100;
    const visibleMax = min + (fullRange * xAxisRange[1]) / 100;

    return {
      minTime: visibleMin,
      maxTime: visibleMax,
      timeRange: visibleMax - visibleMin,
      fullMinTime: min,
      fullMaxTime: max,
      fullTimeRange: fullRange,
    };
  }, [data, xAxisRange]);

  const rowHeight = 40;
  const rowGap = 10;
  const leftLabelWidth = 200;
  const topPadding = 60;
  const bottomPadding = 40;
  const rightPadding = 40;

  const baseChartWidth = 1200;
  const chartWidth = baseChartWidth * zoomLevel;
  const chartHeight = sortedData.length * (rowHeight + rowGap) + topPadding + bottomPadding;

  const timeToX = (time: Date) => {
    const timestamp = time.getTime();
    return leftLabelWidth + ((timestamp - minTime) / timeRange) * (chartWidth - leftLabelWidth - rightPadding);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 1));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setXAxisRange([0, 100]);
  };

  const handlePanLeft = () => {
    const rangeWidth = xAxisRange[1] - xAxisRange[0];
    const shift = rangeWidth * 0.2;
    setXAxisRange(prev => [
      Math.max(0, prev[0] - shift),
      Math.max(rangeWidth, prev[1] - shift),
    ]);
  };

  const handlePanRight = () => {
    const rangeWidth = xAxisRange[1] - xAxisRange[0];
    const shift = rangeWidth * 0.2;
    setXAxisRange(prev => [
      Math.min(100 - rangeWidth, prev[0] + shift),
      Math.min(100, prev[1] + shift),
    ]);
  };

  const handleXAxisZoomIn = () => {
    const center = (xAxisRange[0] + xAxisRange[1]) / 2;
    const newWidth = (xAxisRange[1] - xAxisRange[0]) * 0.7;
    setXAxisRange([
      Math.max(0, center - newWidth / 2),
      Math.min(100, center + newWidth / 2),
    ]);
  };

  const handleXAxisZoomOut = () => {
    const center = (xAxisRange[0] + xAxisRange[1]) / 2;
    const newWidth = Math.min(100, (xAxisRange[1] - xAxisRange[0]) / 0.7);
    setXAxisRange([
      Math.max(0, center - newWidth / 2),
      Math.min(100, center + newWidth / 2),
    ]);
  };

  const generateTimeMarkers = () => {
    const markers: Array<{ time: Date; x: number; label: string; type: 'day' | 'hour' }> = [];
    const timeRangeDays = timeRange / (1000 * 60 * 60 * 24);

    // Determine if we should show hourly markers based on zoom level
    const showHourly = timeRangeDays < 7; // Show hourly when viewing less than 7 days

    if (showHourly) {
      // Hourly markers
      const startHour = new Date(minTime);
      startHour.setMinutes(0, 0, 0);

      let currentTime = startHour.getTime();
      while (currentTime <= maxTime) {
        const time = new Date(currentTime);
        const x = timeToX(time);
        const hour = time.getHours();

        // Mark midnight as a day marker
        if (hour === 0) {
          markers.push({
            time,
            x,
            label: format(time, 'MMM dd'),
            type: 'day',
          });
        } else {
          markers.push({
            time,
            x,
            label: format(time, 'HH:mm'),
            type: 'hour',
          });
        }

        currentTime += 60 * 60 * 1000; // Add 1 hour
      }
    } else {
      // Daily markers only
      const startDay = new Date(minTime);
      startDay.setHours(0, 0, 0, 0);

      let currentTime = startDay.getTime();
      while (currentTime <= maxTime) {
        const time = new Date(currentTime);
        const x = timeToX(time);
        markers.push({
          time,
          x,
          label: format(time, 'MMM dd'),
          type: 'day',
        });

        currentTime += 24 * 60 * 60 * 1000; // Add 1 day
      }
    }

    return markers;
  };

  const timeMarkers = generateTimeMarkers();

  const handleWindowMouseEnter = useCallback((
    event: React.MouseEvent<SVGRectElement>,
    window: WindowRow,
    campaignName: string
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      window,
      campaignName,
      mouseX: rect.left + rect.width / 2,
      mouseY: rect.top,
    });
  }, []);

  const handleWindowMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No window data available for the selected filters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="p-2 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800 text-center">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Total Windows</p>
          <p className="text-base font-bold text-foreground">
            {sortedData.reduce((sum, c) => sum + c.totalWindows, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800 text-center">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Total Duration</p>
          <p className="text-base font-bold text-foreground">
            {(sortedData.reduce((sum, c) => sum + c.totalDuration, 0) / 60).toFixed(1)} hrs
          </p>
        </Card>
        <Card className="p-2 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Avg Windows/Campaign</p>
          <p className="text-base font-bold text-foreground">
            {(sortedData.reduce((sum, c) => sum + c.totalWindows, 0) / sortedData.length).toFixed(1)}
          </p>
        </Card>
        <Card className="p-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800 text-center">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Active Campaigns</p>
          <p className="text-base font-bold text-foreground">{sortedData.length}</p>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {sortedData.length} campaign{sortedData.length !== 1 ? 's' : ''} with active windows
            </p>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Full range: {format(new Date(fullMinTime), 'PPp')} → {format(new Date(fullMaxTime), 'PPp')}
          </p>
          <p className="text-xs text-muted-foreground pl-6">
            Viewing: {format(new Date(minTime), 'PPp')} → {format(new Date(maxTime), 'PPp')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Y-axis Zoom:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 10}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">X-axis Zoom:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleXAxisZoomOut}
              disabled={xAxisRange[0] === 0 && xAxisRange[1] === 100}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center font-mono">
              {Math.round(xAxisRange[1] - xAxisRange[0])}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleXAxisZoomIn}
              disabled={xAxisRange[1] - xAxisRange[0] < 5}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePanLeft}
              disabled={xAxisRange[0] === 0}
              title="Pan left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePanRight}
              disabled={xAxisRange[1] === 100}
              title="Pan right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              disabled={zoomLevel === 1 && xAxisRange[0] === 0 && xAxisRange[1] === 100}
              title="Reset all zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 bg-muted/30">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Time Range Selection</label>
            <span className="text-xs text-muted-foreground">
              {Math.round(xAxisRange[1] - xAxisRange[0])}% of timeline visible
            </span>
          </div>
          <Slider
            value={xAxisRange}
            onValueChange={(value) => setXAxisRange(value as [number, number])}
            min={0}
            max={100}
            step={0.5}
            minStepsBetweenThumbs={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{format(new Date(fullMinTime + (fullTimeRange * xAxisRange[0]) / 100), 'MMM dd HH:mm')}</span>
            <span>{format(new Date(fullMinTime + (fullTimeRange * xAxisRange[1]) / 100), 'MMM dd HH:mm')}</span>
          </div>
        </div>
      </Card>

      <div
        ref={scrollRef}
        className="relative border-2 rounded-xl bg-gradient-to-br from-background to-muted/20 overflow-auto shadow-lg px-4 py-4"
        style={{ maxHeight: height }}
      >
        <svg
          width={Math.max(chartWidth, 800)}
          height={chartHeight}
          className="select-none"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height={rowHeight + rowGap}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M 40 0 L 0 0 0 ${rowHeight + rowGap}`}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
            <linearGradient id="windowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
            </linearGradient>
            <filter id="windowShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x={leftLabelWidth}
            y={topPadding}
            width={chartWidth - leftLabelWidth - rightPadding}
            height={chartHeight - topPadding - bottomPadding}
            fill="url(#grid)"
          />

          {timeMarkers.map((marker, i) => {
            const isDayMarker = marker.type === 'day';
            return (
              <g key={i}>
                <line
                  x1={marker.x}
                  y1={topPadding}
                  x2={marker.x}
                  y2={chartHeight - bottomPadding}
                  stroke={isDayMarker ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth={isDayMarker ? '2' : '1'}
                  strokeDasharray={isDayMarker ? undefined : '3 3'}
                  opacity={isDayMarker ? '0.6' : '0.3'}
                />
                <text
                  x={marker.x}
                  y={topPadding - 10}
                  textAnchor="middle"
                  className={isDayMarker ? 'fill-primary font-semibold' : 'fill-muted-foreground'}
                  style={{ fontSize: isDayMarker ? '11px' : '9px' }}
                >
                  {marker.label}
                </text>
              </g>
            );
          })}

          {sortedData.map((campaign, index) => {
            const y = topPadding + index * (rowHeight + rowGap);
            return (
              <line
                key={`separator-${campaign.campaign_id}`}
                x1={leftLabelWidth}
                y1={y + rowHeight}
                x2={chartWidth - rightPadding}
                y2={y + rowHeight}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {sortedData.map((campaign, index) => {
            const y = topPadding + index * (rowHeight + rowGap);
            const campaignName = campaign.campaign_name || `Campaign ${campaign.campaign_id}`;
            const isEven = index % 2 === 0;

            return (
              <g key={campaign.campaign_id}>
                <rect
                  x={leftLabelWidth}
                  y={y}
                  width={chartWidth - leftLabelWidth - rightPadding}
                  height={rowHeight}
                  fill="hsl(var(--muted))"
                  fillOpacity={isEven ? "0.15" : "0.05"}
                />

                <rect
                  x={0}
                  y={y}
                  width={leftLabelWidth - 10}
                  height={rowHeight}
                  fill="hsl(var(--muted))"
                  fillOpacity="0.5"
                  rx="6"
                  className="transition-all hover:fill-opacity-70"
                />

                <text
                  x={10}
                  y={y + rowHeight / 2}
                  dominantBaseline="middle"
                  className="font-semibold fill-foreground"
                  style={{ fontSize: '11px' }}
                >
                  {campaignName.length > 25
                    ? campaignName.substring(0, 25) + '...'
                    : campaignName}
                </text>

                <text
                  x={leftLabelWidth - 15}
                  y={y + rowHeight / 2}
                  dominantBaseline="middle"
                  textAnchor="end"
                  className="fill-muted-foreground font-mono"
                  style={{ fontSize: '9px' }}
                >
                  ({campaign.totalWindows})
                </text>

                {campaign.windows.map((window, windowIndex) => {
                  // Ensure dates are Date objects
                  const startTime = window.start_time instanceof Date
                    ? window.start_time
                    : new Date(window.start_time);
                  const endTime = window.end_time instanceof Date
                    ? window.end_time
                    : new Date(window.end_time);

                  const startX = timeToX(startTime);
                  const endX = timeToX(endTime);
                  const width = Math.max(endX - startX, 3);

                  return (
                    <g key={windowIndex}>
                      <rect
                        x={startX}
                        y={y + 6}
                        width={width}
                        height={rowHeight - 12}
                        fill="url(#windowGradient)"
                        stroke="#7c3aed"
                        strokeWidth="1.5"
                        rx="4"
                        filter="url(#windowShadow)"
                        className="transition-all hover:stroke-[#6d28d9] hover:stroke-2 cursor-pointer"
                        style={{
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseEnter={(e) => handleWindowMouseEnter(e, window, campaignName)}
                        onMouseLeave={handleWindowMouseLeave}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          <line
            x1={leftLabelWidth}
            y1={topPadding}
            x2={leftLabelWidth}
            y2={chartHeight - bottomPadding}
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        </svg>
      </div>

      {tooltipData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipData.mouseX}px`,
            top: `${tooltipData.mouseY - 10}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Card className="shadow-2xl border-2 border-purple-500/50 bg-card/95 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground">
                  {tooltipData.campaignName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Campaign ID: {tooltipData.window.campaign_id}
                </p>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground font-medium">Start:</span>
                    <span className="text-foreground font-mono">
                      {format(
                        tooltipData.window.start_time instanceof Date
                          ? tooltipData.window.start_time
                          : new Date(tooltipData.window.start_time),
                        'PPp'
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground font-medium">End:</span>
                    <span className="text-foreground font-mono">
                      {format(
                        tooltipData.window.end_time instanceof Date
                          ? tooltipData.window.end_time
                          : new Date(tooltipData.window.end_time),
                        'PPp'
                      )}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">Duration:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      {tooltipData.window.window_duration_minutes.toFixed(1)} minutes
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

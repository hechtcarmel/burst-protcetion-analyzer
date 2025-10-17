'use client';

import { useEffect, useRef } from 'react';
import CountUp from 'react-countup';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const prevValue = useRef(0);

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  return (
    <CountUp
      start={prevValue.current}
      end={value}
      duration={duration}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={className}
      preserveValue
    />
  );
}

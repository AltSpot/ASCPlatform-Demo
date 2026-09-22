'use client';

/**
 * The industry filter. Shared by the Radar board and the deal shelf.
 *
 * It is the platform's one dropdown (components/ui/Select) in its pill
 * form, so it matches every other dropdown on the platform and the pills
 * beside it on the bar (Tyler, 2026-09-21). What it adds is the data: a
 * count against every industry, so a member can see where the board is
 * thin before they filter it down to nothing, and the chosen outline on
 * the pill while an industry is narrowing the page.
 */
import { Factory } from 'lucide-react';

import Select from '@/components/ui/Select';
import { INDUSTRIES, type Industry } from '@/lib/terminal/radar';

const ALL = 'all' as const;

export default function IndustryMenu({
  industries,
  counts,
  value,
  onChange,
}: {
  /** Industries present on the board, in taxonomy order. */
  industries: Industry[];
  /** How many names sit in each industry. */
  counts: Record<string, number>;
  value: Industry | null;
  onChange: (next: Industry | null) => void;
}) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const options = [
    { value: ALL as Industry | typeof ALL, label: 'All industries', count: total },
    ...industries.map((key) => ({
      value: key as Industry | typeof ALL,
      label: INDUSTRIES[key],
      count: counts[key] ?? 0,
    })),
  ];

  return (
    <Select
      variant="pill"
      label="Industry"
      icon={Factory}
      value={value ?? ALL}
      options={options}
      chosen={value !== null}
      onChange={(next) => onChange(next === ALL ? null : (next as Industry))}
    />
  );
}

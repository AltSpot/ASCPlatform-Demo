/** How much of a deal's allocation is spoken for. */
import { money } from '@/lib/format';

export default function AllocBar({
  allocationTotal,
  allocationRemaining,
}: {
  allocationTotal: number;
  allocationRemaining: number;
}) {
  const subscribed = allocationTotal - allocationRemaining;
  const pct =
    allocationTotal > 0
      ? Math.min(100, Math.max(0, Math.round((subscribed / allocationTotal) * 100)))
      : 0;

  return (
    <div className="alloc">
      <div className="bar">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="lab">
        <span>{pct}% subscribed</span>
        <span>{money(allocationRemaining)} remaining</span>
      </div>
    </div>
  );
}

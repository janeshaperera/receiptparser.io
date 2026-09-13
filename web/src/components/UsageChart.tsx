"use client";

interface UsageChartProps {
  days: Array<{ date: string; count: number }>;
}

export default function UsageChart({ days }: UsageChartProps) {
  if (!days || days.length === 0) {
    return (
      <div className="h-44 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-500 text-xs">
        No usage records recorded in the past 30 days.
      </div>
    );
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      <div className="h-44 flex items-end gap-1.5 sm:gap-2 px-2 pt-6 pb-2 bg-slate-900/40 rounded-xl border border-slate-800">
        {days.map((item, idx) => {
          const heightPct = Math.max(6, Math.round((item.count / maxCount) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute -top-9 hidden group-hover:flex px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-white whitespace-nowrap z-10 font-mono shadow-lg">
                {item.date}: {item.count} reqs
              </div>
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full rounded-t bg-cyan-500/60 hover:bg-cyan-400 transition-all cursor-pointer"
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] font-mono text-slate-500 px-1">
        <span>{days[0]?.date || "Oldest"}</span>
        <span>{days[days.length - 1]?.date || "Today"}</span>
      </div>
    </div>
  );
}

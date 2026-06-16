import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendType = "up" | "down" | "stable";
type StatusType = "normal" | "warning" | "alarm";

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: TrendType;
  trendValue?: string;
  status?: StatusType;
  icon: LucideIcon;
}

const statusColors: Record<StatusType, string> = {
  normal: "text-status-normal",
  warning: "text-status-warning",
  alarm: "text-status-alarm",
};

const statusBgColors: Record<StatusType, string> = {
  normal: "bg-status-normal/10",
  warning: "bg-status-warning/10",
  alarm: "bg-status-alarm/10",
};

export default function KPICard({
  title,
  value,
  unit,
  trend,
  trendValue,
  status = "normal",
  icon: Icon,
}: KPICardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-status-normal"
      : trend === "down"
        ? "text-status-alarm"
        : "text-slate-400";

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${statusColors[status]}`}>
              {value}
            </span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-xs ${trendColor}`}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${statusBgColors[status]}`}>
          <Icon className={`w-6 h-6 ${statusColors[status]}`} />
        </div>
      </div>
    </div>
  );
}

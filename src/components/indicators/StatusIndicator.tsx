type StatusType = "normal" | "warning" | "alarm";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const statusConfig: Record<
  StatusType,
  { color: string; bgColor: string; text: string; labelColor: string }
> = {
  normal: {
    color: "bg-status-normal",
    bgColor: "bg-status-normal/10",
    text: "正常",
    labelColor: "text-status-normal",
  },
  warning: {
    color: "bg-status-warning",
    bgColor: "bg-status-warning/10",
    text: "预警",
    labelColor: "text-status-warning",
  },
  alarm: {
    color: "bg-status-alarm",
    bgColor: "bg-status-alarm/10",
    text: "报警",
    labelColor: "text-status-alarm",
  },
};

const sizeConfig = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export default function StatusIndicator({
  status,
  label,
  showLabel = true,
  size = "md",
  pulse = true,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.text;

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizeConfig[size]} ${config.color} rounded-full ${
          pulse && status !== "normal" ? "animate-blink" : ""
        } ${status === "normal" ? "animate-pulse-slow" : ""}`}
      />
      {showLabel && (
        <span className={`text-sm font-medium ${config.labelColor}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
}

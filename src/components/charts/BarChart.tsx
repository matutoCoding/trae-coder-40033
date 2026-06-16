import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface BarChartProps {
  title?: string;
  xAxisData: string[] | number[];
  series: {
    name: string;
    data: number[];
    color?: string;
  }[];
  yAxisName?: string;
  height?: string | number;
  showLegend?: boolean;
  horizontal?: boolean;
}

export default function BarChart({
  title,
  xAxisData,
  series,
  yAxisName,
  height = 300,
  showLegend = true,
  horizontal = false,
}: BarChartProps) {
  const defaultColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          textStyle: {
            color: "#F1F5F9",
            fontSize: 14,
            fontWeight: 600,
          },
          left: 0,
          top: 0,
        }
      : undefined,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: {
        color: "#F1F5F9",
      },
    },
    legend: showLegend
      ? {
          data: series.map((s) => s.name),
          textStyle: {
            color: "#94A3B8",
          },
          top: title ? 30 : 0,
          right: 0,
        }
      : undefined,
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: title ? (showLegend ? 70 : 40) : showLegend ? 40 : 20,
      containLabel: true,
    },
    xAxis: horizontal
      ? {
          type: "value",
          name: yAxisName,
          nameTextStyle: {
            color: "#94A3B8",
            fontSize: 12,
          },
          axisLine: {
            show: false,
          },
          axisLabel: {
            color: "#94A3B8",
            fontSize: 12,
          },
          splitLine: {
            lineStyle: {
              color: "#334155",
              type: "dashed",
            },
          },
        }
      : {
          type: "category",
          data: xAxisData,
          axisLine: {
            lineStyle: {
              color: "#475569",
            },
          },
          axisLabel: {
            color: "#94A3B8",
            fontSize: 12,
          },
          axisTick: {
            show: false,
          },
        },
    yAxis: horizontal
      ? {
          type: "category",
          data: xAxisData,
          axisLine: {
            lineStyle: {
              color: "#475569",
            },
          },
          axisLabel: {
            color: "#94A3B8",
            fontSize: 12,
          },
          axisTick: {
            show: false,
          },
        }
      : {
          type: "value",
          name: yAxisName,
          nameTextStyle: {
            color: "#94A3B8",
            fontSize: 12,
          },
          axisLine: {
            show: false,
          },
          axisLabel: {
            color: "#94A3B8",
            fontSize: 12,
          },
          splitLine: {
            lineStyle: {
              color: "#334155",
              type: "dashed",
            },
          },
        },
    series: series.map((s, index) => ({
      name: s.name,
      type: "bar",
      data: s.data,
      barWidth: horizontal ? "50%" : "40%",
      itemStyle: {
        color: s.color || defaultColors[index % defaultColors.length],
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      emphasis: {
        focus: "series",
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.3)",
        },
      },
    })),
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}

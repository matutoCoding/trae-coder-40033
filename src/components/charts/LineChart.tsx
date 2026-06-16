import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface LineChartProps {
  title?: string;
  xAxisData: string[] | number[];
  series: {
    name: string;
    data: number[];
    color?: string;
    smooth?: boolean;
  }[];
  yAxisName?: string;
  height?: string | number;
  showLegend?: boolean;
}

export default function LineChart({
  title,
  xAxisData,
  series,
  yAxisName,
  height = 300,
  showLegend = true,
}: LineChartProps) {
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
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: {
        color: "#F1F5F9",
      },
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#334155",
        },
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
    xAxis: {
      type: "category",
      data: xAxisData,
      boundaryGap: false,
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
    yAxis: {
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
      type: "line",
      data: s.data,
      smooth: s.smooth ?? true,
      symbol: "circle",
      symbolSize: 6,
      showSymbol: false,
      lineStyle: {
        width: 2,
        color: s.color || defaultColors[index % defaultColors.length],
      },
      itemStyle: {
        color: s.color || defaultColors[index % defaultColors.length],
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: `${s.color || defaultColors[index % defaultColors.length]}33`,
            },
            {
              offset: 1,
              color: `${s.color || defaultColors[index % defaultColors.length]}00`,
            },
          ],
        },
      },
      emphasis: {
        focus: "series",
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

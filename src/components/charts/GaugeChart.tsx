import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface GaugeChartProps {
  title?: string;
  value: number;
  max?: number;
  min?: number;
  unit?: string;
  height?: string | number;
  warningThreshold?: number;
  alarmThreshold?: number;
}

export default function GaugeChart({
  title,
  value,
  max = 100,
  min = 0,
  unit,
  height = 250,
  warningThreshold,
  alarmThreshold,
}: GaugeChartProps) {
  const getColor = () => {
    if (alarmThreshold !== undefined && value >= alarmThreshold) {
      return "#EF4444";
    }
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return "#F59E0B";
    }
    return "#10B981";
  };

  const color = getColor();

  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          textStyle: {
            color: "#F1F5F9",
            fontSize: 14,
            fontWeight: 600,
          },
          left: "center",
          top: 0,
        }
      : undefined,
    series: [
      {
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: min,
        max: max,
        splitNumber: 10,
        center: ["50%", title ? "60%" : "55%"],
        radius: "85%",
        itemStyle: {
          color: color,
        },
        progress: {
          show: true,
          width: 12,
          roundCap: true,
        },
        pointer: {
          icon: "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.82621,732.644867 2083.82621,729.028337 L2083.82621,728.939159 L2088.28459,617.496185 C2088.32936,616.378084 2089.24947,615.30999 2090.3693,615.30999 Z",
          length: "65%",
          width: 10,
          offsetCenter: [0, "-10%"],
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 12,
            color: [[1, "#334155"]],
          },
        },
        axisTick: {
          splitNumber: 2,
          lineStyle: {
            width: 1,
            color: "#64748B",
          },
          length: 8,
        },
        splitLine: {
          length: 14,
          lineStyle: {
            width: 2,
            color: "#64748B",
          },
        },
        axisLabel: {
          color: "#94A3B8",
          fontSize: 11,
          distance: 24,
          formatter: (value: number) => {
            return value.toString();
          },
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            color: color,
            borderWidth: 4,
            borderColor: "#1E293B",
          },
        },
        title: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          fontWeight: "bold",
          color: color,
          offsetCenter: [0, "30%"],
          formatter: (value: number) => {
            return unit ? `${value} ${unit}` : value.toString();
          },
        },
        data: [
          {
            value: value,
          },
        ],
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}

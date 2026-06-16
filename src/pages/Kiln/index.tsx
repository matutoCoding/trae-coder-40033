import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import LineChart from "@/components/charts/LineChart";
import {
  Flame,
  Gauge,
  Wind,
  TrendingUp,
  Thermometer,
  ArrowRightLeft,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export default function Kiln() {
  const { realtimeData, historyData } = useAppStore();
  const { kilnData, kilnShellPoints } = realtimeData;
  const kilnHistory = historyData.kilnData;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const timeLabels = kilnHistory.map((d) => formatTime(d.timestamp));
  const kilnSpeedData = kilnHistory.map((d) => d.kilnSpeed);
  const kilnCurrentData = kilnHistory.map((d) => d.kilnCurrent);

  const shellPositions = kilnShellPoints.map((p) => `${p.position}%`);
  const shellTemps = kilnShellPoints.map((p) => p.temperature);
  const brickThickness = kilnShellPoints.map((p) => p.brickThickness);

  const shellHeatmapOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: shellPositions,
      axisLine: { lineStyle: { color: "#475569" } },
      axisLabel: { color: "#94A3B8", fontSize: 10, interval: 4 },
      axisTick: { show: false },
      name: "窑长方向",
      nameTextStyle: { color: "#94A3B8", fontSize: 12 },
    },
    yAxis: {
      type: "value",
      min: 180,
      max: 450,
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 12 },
      splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
      name: "温度(°C)",
      nameTextStyle: { color: "#94A3B8", fontSize: 12 },
    },
    visualMap: {
      min: 180,
      max: 450,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: "#94A3B8" },
      inRange: {
        color: ["#1E40AF", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
      },
    },
    series: [
      {
        type: "bar",
        data: shellTemps,
        barWidth: "80%",
        itemStyle: {
          borderRadius: [2, 2, 0, 0],
        },
        emphasis: { focus: "series" },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">回转窑煅烧模块</h1>
        <p className="text-sm text-slate-400 mt-1">
          实时监控窑系统运行参数、筒体温度分布及窑皮状态
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="窑头喂煤量"
          value={kilnData.kilnHeadCoalRate.toFixed(2)}
          unit="t/h"
          icon={Flame}
          status="normal"
          trend="stable"
          trendValue="±0.2"
        />
        <KPICard
          title="火焰温度"
          value={kilnData.flameTemp}
          unit="°C"
          icon={Thermometer}
          status={kilnData.flameTemp > 1750 ? "warning" : "normal"}
          trend="up"
          trendValue="+15°C"
        />
        <KPICard
          title="一次风压"
          value={kilnData.primaryAirPressure.toFixed(1)}
          unit="kPa"
          icon={Wind}
          status="normal"
          trend="stable"
          trendValue="±0.5"
        />
        <KPICard
          title="窑头负压"
          value={-50 + Math.round(Math.random() * 30)}
          unit="Pa"
          icon={ArrowRightLeft}
          status="normal"
          trend="stable"
          trendValue="±5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-industrial-400" />
            窑速与窑电流趋势
          </h3>
          <ReactECharts
            option={{
              tooltip: {
                trigger: "axis",
                backgroundColor: "#1E293B",
                borderColor: "#334155",
                textStyle: { color: "#F1F5F9" },
                axisPointer: { type: "cross", label: { backgroundColor: "#334155" } },
              },
              legend: {
                data: ["窑速", "窑电流"],
                textStyle: { color: "#94A3B8" },
                right: 0,
                top: 0,
              },
              grid: {
                left: "3%",
                right: "4%",
                bottom: "3%",
                top: 50,
                containLabel: true,
              },
              xAxis: {
                type: "category",
                data: timeLabels,
                boundaryGap: false,
                axisLine: { lineStyle: { color: "#475569" } },
                axisLabel: { color: "#94A3B8", fontSize: 12 },
                axisTick: { show: false },
              },
              yAxis: [
                {
                  type: "value",
                  name: "窑速(r/min)",
                  nameTextStyle: { color: "#94A3B8", fontSize: 12 },
                  min: 2.5,
                  max: 4.5,
                  axisLine: { show: false },
                  axisLabel: { color: "#94A3B8", fontSize: 12 },
                  splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
                },
                {
                  type: "value",
                  name: "窑电流(A)",
                  nameTextStyle: { color: "#94A3B8", fontSize: 12 },
                  min: 400,
                  max: 800,
                  axisLine: { show: false },
                  axisLabel: { color: "#94A3B8", fontSize: 12 },
                  splitLine: { show: false },
                },
              ],
              series: [
                {
                  name: "窑速",
                  type: "line",
                  data: kilnSpeedData,
                  smooth: true,
                  symbol: "circle",
                  symbolSize: 6,
                  showSymbol: false,
                  lineStyle: { width: 2, color: "#3B82F6" },
                  itemStyle: { color: "#3B82F6" },
                  yAxisIndex: 0,
                  areaStyle: {
                    color: {
                      type: "linear",
                      x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: "#3B82F633" },
                        { offset: 1, color: "#3B82F600" },
                      ],
                    },
                  },
                },
                {
                  name: "窑电流",
                  type: "line",
                  data: kilnCurrentData,
                  smooth: true,
                  symbol: "circle",
                  symbolSize: 6,
                  showSymbol: false,
                  lineStyle: { width: 2, color: "#F59E0B" },
                  itemStyle: { color: "#F59E0B" },
                  yAxisIndex: 1,
                },
              ],
            }}
            style={{ height: 320, width: "100%" }}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Thermometer className="w-5 h-5 text-status-warning" />
            窑筒体温度分布
          </h3>
          <ReactECharts
            option={shellHeatmapOption}
            style={{ height: 320, width: "100%" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="data-card lg:col-span-2">
          <h3 className="section-title">
            <Gauge className="w-5 h-5 text-industrial-400" />
            窑皮厚度估算曲线
          </h3>
          <LineChart
            xAxisData={shellPositions}
            series={[
              {
                name: "窑皮厚度(mm)",
                data: brickThickness,
                color: "#8B5CF6",
                smooth: true,
              },
            ]}
            height={280}
            showLegend={false}
          />
        </div>

        <div className="space-y-4">
          <div className="data-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-status-warning/10">
                <Thermometer className="w-5 h-5 text-status-warning" />
              </div>
              <div>
                <p className="text-sm text-slate-400">窑尾温度(烟室)</p>
                <p className="text-3xl font-bold text-status-warning">
                  {kilnData.kilnInletTemp}
                  <span className="text-base font-normal text-slate-400 ml-1">°C</span>
                </p>
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-status-warning rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (kilnData.kilnInletTemp / 1200) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>900°C</span>
              <span>1200°C</span>
            </div>
          </div>

          <div className="data-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-industrial-500/10">
                <Wind className="w-5 h-5 text-industrial-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">废气温度(C1出口)</p>
                <p className="text-3xl font-bold text-industrial-400">
                  {kilnData.kilnOutletTemp}
                  <span className="text-base font-normal text-slate-400 ml-1">°C</span>
                </p>
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-industrial-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (kilnData.kilnOutletTemp / 350) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>150°C</span>
              <span>350°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

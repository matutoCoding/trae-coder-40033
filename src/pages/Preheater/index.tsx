import { useMemo } from "react";
import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import StatusIndicator from "@/components/indicators/StatusIndicator";
import {
  Flame,
  Thermometer,
  Gauge,
  Wind,
  TrendingUp,
  Layers,
} from "lucide-react";

const STAGE_CONFIG = [
  { key: "C1", tempRange: { min: 280, max: 380 }, pressureRange: { min: -6, max: -3.5 }, color: "#3B82F6" },
  { key: "C2", tempRange: { min: 400, max: 520 }, pressureRange: { min: -5.5, max: -3 }, color: "#10B981" },
  { key: "C3", tempRange: { min: 570, max: 700 }, pressureRange: { min: -5, max: -2.5 }, color: "#F59E0B" },
  { key: "C4", tempRange: { min: 700, max: 840 }, pressureRange: { min: -4.5, max: -2 }, color: "#8B5CF6" },
  { key: "C5", tempRange: { min: 800, max: 940 }, pressureRange: { min: -4, max: -1.5 }, color: "#EF4444" },
];

export default function Preheater() {
  const { realtimeData, historyData } = useAppStore();
  const { preheaterData } = realtimeData;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  };

  const stages = useMemo(() => {
    const temps = [
      preheaterData.c1_temp,
      preheaterData.c2_temp,
      preheaterData.c3_temp,
      preheaterData.c4_temp,
      preheaterData.c5_temp,
    ];
    const pressures = [
      preheaterData.c1_pressure,
      preheaterData.c2_pressure,
      preheaterData.c3_pressure,
      preheaterData.c4_pressure,
      preheaterData.c5_pressure,
    ];
    return STAGE_CONFIG.map((config, idx) => ({
      ...config,
      temp: temps[idx],
      pressure: pressures[idx],
    }));
  }, [preheaterData]);

  const getTempStatus = (temp: number, range: { min: number; max: number }) => {
    if (temp < range.min || temp > range.max) return "warning";
    return "normal";
  };

  const getPressureStatus = (pressure: number, range: { min: number; max: number }) => {
    if (pressure < range.min || pressure > range.max) return "warning";
    return "normal";
  };

  const tempBarData = useMemo(() => {
    const xAxisData = stages.map((s) => s.key);
    const actualTemps = stages.map((s) => s.temp);
    const minTemps = stages.map((s) => s.tempRange.min);
    const maxTemps = stages.map((s) => s.tempRange.max);
    return { xAxisData, actualTemps, minTemps, maxTemps };
  }, [stages]);

  const calcinerTrendData = useMemo(() => {
    const timestamps = historyData.preheaterData.map((d) => formatTime(d.timestamp));
    const temps = historyData.preheaterData.map((d) => d.calcinerTemp);
    const coalRates = historyData.preheaterData.map((d) => d.calcinerCoalRate);
    return { timestamps, temps, coalRates };
  }, [historyData.preheaterData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 data-card">
          <h3 className="section-title">
            <Layers className="w-5 h-5 text-industrial-400" />
            预热器各级温度压力
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
            {[...stages].reverse().map((stage, idx) => (
              <div
                key={stage.key}
                className="relative"
              >
                <div
                  className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 flex flex-col items-center"
                  style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${stage.color}15`, border: `2px solid ${stage.color}` }}
                  >
                    <span className="text-xl font-bold" style={{ color: stage.color }}>
                      {stage.key}
                    </span>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Thermometer className="w-3 h-3" />
                        温度
                      </div>
                      <StatusIndicator
                        status={getTempStatus(stage.temp, stage.tempRange)}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                    <div
                      className="text-lg font-bold text-center py-1 rounded"
                      style={{
                        color: stage.color,
                        backgroundColor: `${stage.color}10`,
                      }}
                    >
                      {stage.temp}℃
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">
                      范围: {stage.tempRange.min}~{stage.tempRange.max}℃
                    </div>

                    <div className="h-px bg-slate-700 my-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Gauge className="w-3 h-3" />
                        压力
                      </div>
                      <StatusIndicator
                        status={getPressureStatus(stage.pressure, stage.pressureRange)}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                    <div className="text-lg font-bold text-center py-1 rounded bg-slate-700/30 text-slate-200">
                      {stage.pressure}kPa
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">
                      范围: {stage.pressureRange.min}~{stage.pressureRange.max}kPa
                    </div>
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className="hidden md:flex absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-8 h-6 border-l-2 border-b-2 border-r-2 border-slate-600 rounded-b-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Flame className="w-5 h-5 text-status-warning" />
            分解炉参数
          </h3>
          <div className="space-y-4">
            <KPICard
              title="分解炉温度"
              value={preheaterData.calcinerTemp}
              unit="℃"
              status={preheaterData.calcinerTemp > 920 ? "warning" : preheaterData.calcinerTemp > 900 ? "warning" : "normal"}
              icon={Thermometer}
              trend="stable"
              trendValue="±5℃"
            />
            <KPICard
              title="喂煤量"
              value={preheaterData.calcinerCoalRate}
              unit="t/h"
              status={preheaterData.calcinerCoalRate > 8.5 ? "warning" : "normal"}
              icon={Flame}
              trend="up"
              trendValue="+0.2t/h"
            />
            <KPICard
              title="风煤比"
              value={preheaterData.airCoalRatio}
              unit=""
              status={preheaterData.airCoalRatio < 9.0 || preheaterData.airCoalRatio > 10.0 ? "warning" : "normal"}
              icon={Wind}
              trend="stable"
              trendValue="±0.1"
            />
          </div>

          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">分解炉运行状态</span>
              <StatusIndicator status="normal" pulse={true} />
            </div>
            <div className="text-xs text-slate-500">
              目标风煤比范围: 9.0 ~ 10.0
            </div>
            <div className="text-xs text-slate-500 mt-1">
              目标温度范围: 870℃ ~ 920℃
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <Thermometer className="w-5 h-5 text-industrial-400" />
            各级温度对比
          </h3>
          <BarChart
            xAxisData={tempBarData.xAxisData}
            series={[
              { name: "下限温度", data: tempBarData.minTemps, color: "#3B82F6" },
              { name: "实际温度", data: tempBarData.actualTemps, color: "#10B981" },
              { name: "上限温度", data: tempBarData.maxTemps, color: "#EF4444" },
            ]}
            yAxisName="℃"
            height={300}
            showLegend={true}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-industrial-400" />
            分解炉温度与喂煤量趋势
          </h3>
          <LineChart
            xAxisData={calcinerTrendData.timestamps}
            series={[
              { name: "分解炉温度(℃)", data: calcinerTrendData.temps, color: "#EF4444" },
              { name: "喂煤量(t/h)", data: calcinerTrendData.coalRates, color: "#F59E0B" },
            ]}
            height={300}
            showLegend={true}
          />
        </div>
      </div>
    </div>
  );
}

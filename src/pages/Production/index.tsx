import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import BarChart from "@/components/charts/BarChart";
import {
  Factory,
  TrendingUp,
  Calendar,
  Flame,
  Zap,
  BarChart3,
  Clock,
  Target,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export default function Production() {
  const { realtimeData, productionStats } = useAppStore();
  const { kpiData } = realtimeData;

  const DAILY_TARGET = 3000;
  const todayProgress = (kpiData.dailyOutput / DAILY_TARGET) * 100;

  const todayStats = productionStats.slice(0, 3);
  const shiftOutputs = todayStats.map((s) => s.hourlyOutput * 8);
  const shiftNames = todayStats.map((s) => s.shift);

  const uniqueDates = [...new Set(productionStats.map((s) => s.date))].slice(0, 7);
  const dailyOutputs = uniqueDates.map((date) => {
    const dayStats = productionStats.filter((s) => s.date === date);
    return dayStats.reduce((sum, s) => sum + s.hourlyOutput * 8, 0);
  });

  const avgCoalConsumption =
    productionStats.slice(0, 7).reduce((sum, s) => sum + s.standardCoalConsumption, 0) /
    Math.min(7, productionStats.length);
  const avgPowerConsumption =
    productionStats.slice(0, 7).reduce((sum, s) => sum + s.powerConsumption, 0) /
    Math.min(7, productionStats.length);

  const combinedOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9" },
      axisPointer: { type: "cross", label: { backgroundColor: "#334155" } },
    },
    legend: {
      data: ["日产量(t)", "台时产量(t/h)"],
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
      data: uniqueDates.map((d) => d.slice(5)),
      axisLine: { lineStyle: { color: "#475569" } },
      axisLabel: { color: "#94A3B8", fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "日产量(t)",
        nameTextStyle: { color: "#94A3B8", fontSize: 12 },
        axisLine: { show: false },
        axisLabel: { color: "#94A3B8", fontSize: 12 },
        splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
      },
      {
        type: "value",
        name: "台时(t/h)",
        nameTextStyle: { color: "#94A3B8", fontSize: 12 },
        axisLine: { show: false },
        axisLabel: { color: "#94A3B8", fontSize: 12 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "日产量(t)",
        type: "bar",
        data: dailyOutputs,
        barWidth: "40%",
        itemStyle: {
          color: "#3B82F6",
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: { focus: "series" },
        yAxisIndex: 0,
      },
      {
        name: "台时产量(t/h)",
        type: "line",
        data: dailyOutputs.map((v) => (v / 24).toFixed(1)),
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 2, color: "#F59E0B" },
        itemStyle: { color: "#F59E0B" },
        yAxisIndex: 1,
      },
    ],
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">台时产量模块</h1>
        <p className="text-sm text-slate-400 mt-1">
          实时产量监控、班次统计及能耗指标分析
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="data-card lg:col-span-1 bg-gradient-to-br from-industrial-900/50 to-slate-800 border-industrial-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Factory className="w-5 h-5 text-industrial-400" />
            <h3 className="text-base font-semibold text-slate-100">当前台时产量</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-6xl font-bold text-industrial-400 mb-2">
              {kpiData.hourlyOutput.toFixed(1)}
            </p>
            <p className="text-lg text-slate-400">吨/小时 (t/h)</p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-status-normal" />
            <span className="text-sm text-status-normal">较昨日同期 +3.2%</span>
          </div>
        </div>

        <div className="data-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-status-warning" />
              <h3 className="text-base font-semibold text-slate-100">今日累计产量</h3>
            </div>
            <span className="text-sm text-slate-400">
              目标: {DAILY_TARGET} t
            </span>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-5xl font-bold text-status-normal">
                {kpiData.dailyOutput}
              </p>
              <p className="text-sm text-slate-400">吨 (t)</p>
            </div>
            <div className="flex-1 pb-2">
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    todayProgress >= 100
                      ? "bg-status-normal"
                      : todayProgress >= 70
                        ? "bg-industrial-500"
                        : "bg-status-warning"
                  }`}
                  style={{ width: `${Math.min(100, todayProgress)}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-100">
                {todayProgress.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400">完成率</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
            <div className="text-center">
              <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">运行时长</p>
              <p className="text-lg font-semibold text-slate-100">
                {Math.floor(Math.random() * 8) + 16}h
              </p>
            </div>
            <div className="text-center">
              <Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">本月累计</p>
              <p className="text-lg font-semibold text-slate-100">
                {(kpiData.dailyOutput * 20 + Math.random() * 5000).toFixed(0)}t
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">年度累计</p>
              <p className="text-lg font-semibold text-slate-100">
                {(kpiData.dailyOutput * 200 + Math.random() * 50000).toFixed(0)}t
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <BarChart3 className="w-5 h-5 text-industrial-400" />
            班次产量柱状图
          </h3>
          <BarChart
            xAxisData={shiftNames}
            series={[
              {
                name: "产量(t)",
                data: shiftOutputs,
                color: "#3B82F6",
              },
            ]}
            yAxisName="产量(t)"
            height={280}
            showLegend={false}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-status-normal" />
            近7天日产量趋势
          </h3>
          <ReactECharts
            option={combinedOption}
            style={{ height: 280, width: "100%" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="标准煤耗"
          value={avgCoalConsumption.toFixed(1)}
          unit="kg/t"
          icon={Flame}
          status={avgCoalConsumption > 115 ? "warning" : "normal"}
          trend="down"
          trendValue="-1.2 kg/t"
        />
        <KPICard
          title="综合电耗"
          value={avgPowerConsumption.toFixed(1)}
          unit="kWh/t"
          icon={Zap}
          status={avgPowerConsumption > 70 ? "warning" : "normal"}
          trend="stable"
          trendValue="±0.5 kWh/t"
        />
      </div>

      <div className="data-card">
        <h3 className="section-title">
          <Calendar className="w-5 h-5 text-industrial-400" />
          历史产量统计
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>班次</th>
                <th>台时产量(t/h)</th>
                <th>日产量(t)</th>
                <th>煤耗(kg/t)</th>
                <th>电耗(kWh/t)</th>
              </tr>
            </thead>
            <tbody>
              {productionStats.slice(0, 14).map((stat, idx) => (
                <tr key={idx}>
                  <td>{stat.date}</td>
                  <td>
                    <span
                      className={`badge ${
                        stat.shift === "早班"
                          ? "bg-status-normal/20 text-status-normal"
                          : stat.shift === "中班"
                            ? "bg-industrial-500/20 text-industrial-400"
                            : "bg-status-warning/20 text-status-warning"
                      }`}
                    >
                      {stat.shift}
                    </span>
                  </td>
                  <td>{stat.hourlyOutput.toFixed(1)}</td>
                  <td className="font-medium text-slate-100">{stat.dailyOutput}</td>
                  <td>{stat.standardCoalConsumption.toFixed(1)}</td>
                  <td>{stat.powerConsumption.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

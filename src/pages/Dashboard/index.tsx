import { useMemo } from "react";
import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import LineChart from "@/components/charts/LineChart";
import GaugeChart from "@/components/charts/GaugeChart";
import StatusIndicator from "@/components/indicators/StatusIndicator";
import {
  Factory,
  TrendingUp,
  Activity,
  Gauge,
  Zap,
  Thermometer,
  Snowflake,
  AlertTriangle,
  Flame,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export default function Dashboard() {
  const { realtimeData, historyData, alarms } = useAppStore();
  const { kpiData, productionStatus, rawMaterial, kilnData, kilnShellPoints, coolerData } = realtimeData;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  };

  const outputTrendData = useMemo(() => {
    const timestamps = historyData.productionStatus.map((d) => formatTime(d.timestamp));
    const outputRates = historyData.productionStatus.map((d) => d.outputRate);
    const feedRates = historyData.productionStatus.map((d) => d.feedRate);
    return { timestamps, outputRates, feedRates };
  }, [historyData.productionStatus]);

  const heatmapOption: EChartsOption = useMemo(() => {
    const data = kilnShellPoints.map((point, index) => [index, 0, point.temperature]);
    return {
      tooltip: {
        position: "top",
        backgroundColor: "#1E293B",
        borderColor: "#334155",
        textStyle: { color: "#F1F5F9" },
        formatter: (params: unknown) => {
          const p = params as { data: [number, number, number] };
          const point = kilnShellPoints[p.data[0]];
          return `位置: ${point.position}%<br/>温度: ${point.temperature}℃<br/>砖厚: ${point.brickThickness}mm`;
        },
      },
      grid: {
        left: "3%",
        right: "10%",
        top: "15%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: kilnShellPoints.map((p) => `${p.position}%`),
        splitArea: { show: true },
        axisLabel: { color: "#94A3B8", fontSize: 10, interval: 4 },
        axisLine: { lineStyle: { color: "#475569" } },
      },
      yAxis: {
        type: "category",
        data: ["筒体"],
        splitArea: { show: true },
        axisLabel: { color: "#94A3B8", fontSize: 12 },
        axisLine: { lineStyle: { color: "#475569" } },
      },
      visualMap: {
        min: 150,
        max: 450,
        calculable: true,
        orient: "vertical",
        right: "0%",
        top: "center",
        textStyle: { color: "#94A3B8" },
        inRange: {
          color: ["#1E3A8A", "#2563EB", "#F59E0B", "#EF4444", "#991B1B"],
        },
      },
      series: [
        {
          name: "温度",
          type: "heatmap",
          data: data,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }, [kilnShellPoints]);

  const alarmLevelColors = {
    info: "bg-status-info/10 text-status-info border-status-info/30",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/30",
    alarm: "bg-status-alarm/10 text-status-alarm border-status-alarm/30",
  };

  const alarmLevelLabels = {
    info: "提示",
    warning: "预警",
    alarm: "报警",
  };

  const alarmStatusLabels = {
    pending: "待处理",
    confirmed: "已确认",
    resolved: "已解决",
  };

  const alarmStatusColors = {
    pending: "text-status-alarm",
    confirmed: "text-status-warning",
    resolved: "text-status-normal",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        <KPICard
          title="台时产量"
          value={kpiData.hourlyOutput}
          unit="t/h"
          status="normal"
          icon={Factory}
          trend="up"
          trendValue="+2.3%"
        />
        <KPICard
          title="日产量"
          value={kpiData.dailyOutput}
          unit="t/d"
          status="normal"
          icon={TrendingUp}
          trend="up"
          trendValue="+1.8%"
        />
        <KPICard
          title="f-CaO"
          value={kpiData.fCao}
          unit="%"
          status={kpiData.fCao > 1.8 ? "warning" : "normal"}
          icon={Activity}
          trend="stable"
          trendValue="0.1%"
        />
        <KPICard
          title="立升重"
          value={kpiData.literWeight}
          unit="g/L"
          status="normal"
          icon={Gauge}
          trend="up"
          trendValue="+0.5%"
        />
        <KPICard
          title="窑速"
          value={kpiData.kilnSpeed}
          unit="r/min"
          status="normal"
          icon={Zap}
          trend="stable"
          trendValue="0.0"
        />
        <KPICard
          title="窑电流"
          value={kpiData.kilnCurrent}
          unit="A"
          status={kpiData.kilnCurrent > 650 ? "warning" : "normal"}
          icon={Zap}
          trend="up"
          trendValue="+1.2%"
        />
        <KPICard
          title="熟料温度"
          value={kpiData.clinkerTemp}
          unit="℃"
          status={kpiData.clinkerTemp > 100 ? "alarm" : "normal"}
          icon={Thermometer}
          trend="down"
          trendValue="-0.8%"
        />
        <KPICard
          title="冷却效率"
          value={kpiData.coolingEfficiency}
          unit="%"
          status={kpiData.coolingEfficiency < 75 ? "warning" : "normal"}
          icon={Snowflake}
          trend="up"
          trendValue="+0.3%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 data-card">
          <h3 className="section-title">
            <Flame className="w-5 h-5 text-industrial-400" />
            实时生产状态
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">回转窑系统</span>
                <StatusIndicator status={productionStatus.status === "running" ? "normal" : "warning"} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">窑速</span>
                  <span className="text-sm font-medium text-slate-200">{kilnData.kilnSpeed} r/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">窑电流</span>
                  <span className="text-sm font-medium text-slate-200">{kilnData.kilnCurrent} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">窑功率</span>
                  <span className="text-sm font-medium text-slate-200">{kilnData.kilnPower} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">火焰温度</span>
                  <span className="text-sm font-medium text-slate-200">{kilnData.flameTemp} ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">窑头喂煤</span>
                  <span className="text-sm font-medium text-slate-200">{kilnData.kilnHeadCoalRate} t/h</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">预热器系统</span>
                <StatusIndicator status="normal" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">C1温度</span>
                  <span className="text-sm font-medium text-slate-200">{realtimeData.preheaterData.c1_temp} ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">C5温度</span>
                  <span className="text-sm font-medium text-slate-200">{realtimeData.preheaterData.c5_temp} ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">分解炉温度</span>
                  <span className="text-sm font-medium text-slate-200">{realtimeData.preheaterData.calcinerTemp} ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">喂料量</span>
                  <span className="text-sm font-medium text-slate-200">{productionStatus.feedRate} t/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">产量</span>
                  <span className="text-sm font-medium text-slate-200">{productionStatus.outputRate} t/h</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">篦冷机系统</span>
                <StatusIndicator status="normal" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">篦速</span>
                  <span className="text-sm font-medium text-slate-200">{coolerData.grateSpeed} m/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">出料温度</span>
                  <span className="text-sm font-medium text-slate-200">{coolerData.clinkerOutletTemp} ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">冷却效率</span>
                  <span className="text-sm font-medium text-slate-200">{coolerData.coolingEfficiency} %</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">料层厚度</span>
                  <span className="text-sm font-medium text-slate-200">{coolerData.bedThickness} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">一室风压</span>
                  <span className="text-sm font-medium text-slate-200">{coolerData.chamber1Pressure} kPa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <AlertTriangle className="w-5 h-5 text-status-warning" />
            异常报警列表
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`rounded-lg p-3 border ${alarmLevelColors[alarm.level]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-slate-700 text-slate-300">
                      {alarmLevelLabels[alarm.level]}
                    </span>
                    <span className="text-sm font-medium">{alarm.parameter}</span>
                  </div>
                  <span className={`text-xs font-medium ${alarmStatusColors[alarm.status]}`}>
                    {alarmStatusLabels[alarm.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>当前值: <span className="text-slate-200 font-medium">{alarm.value}</span> / 阈值: {alarm.threshold}</span>
                  <span>{new Date(alarm.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 data-card">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-industrial-400" />
            24小时产量趋势
          </h3>
          <LineChart
            xAxisData={outputTrendData.timestamps}
            series={[
              { name: "产量 (t/h)", data: outputTrendData.outputRates, color: "#3B82F6" },
              { name: "喂料量 (t/h)", data: outputTrendData.feedRates, color: "#10B981" },
            ]}
            height={300}
            showLegend={true}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Gauge className="w-5 h-5 text-industrial-400" />
            生料三率值
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <GaugeChart
              title="KH 石灰饱和系数"
              value={rawMaterial.kh_value}
              min={0.8}
              max={1.0}
              warningThreshold={0.94}
              alarmThreshold={0.96}
              height={150}
            />
            <div className="grid grid-cols-2 gap-2">
              <GaugeChart
                title="SM 硅率"
                value={rawMaterial.sm_value}
                min={2.0}
                max={3.2}
                warningThreshold={2.7}
                alarmThreshold={2.9}
                height={140}
              />
              <GaugeChart
                title="IM 铝率"
                value={rawMaterial.im_value}
                min={1.0}
                max={2.2}
                warningThreshold={1.7}
                alarmThreshold={1.9}
                height={140}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="data-card">
        <h3 className="section-title">
          <Thermometer className="w-5 h-5 text-industrial-400" />
          窑筒体温度热力图
        </h3>
        <ReactECharts
          option={heatmapOption}
          style={{ height: 200, width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
}

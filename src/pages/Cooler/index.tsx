import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import LineChart from "@/components/charts/LineChart";
import GaugeChart from "@/components/charts/GaugeChart";
import {
  Gauge,
  Wind,
  ThermometerSun,
  Layers,
  Activity,
  Zap,
} from "lucide-react";

export default function Cooler() {
  const { realtimeData, historyData } = useAppStore();
  const { coolerData } = realtimeData;
  const coolerHistory = historyData.coolerData;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const timeLabels = coolerHistory.map((d) => formatTime(d.timestamp));
  const inletTempData = coolerHistory.map((d) => d.clinkerOutletTemp + 800 + Math.random() * 100);
  const outletTempData = coolerHistory.map((d) => d.clinkerOutletTemp);

  const chamberData = [
    {
      name: "1风室",
      airFlow: coolerData.chamber1AirFlow,
      pressure: coolerData.chamber1Pressure,
      color: "bg-status-normal",
    },
    {
      name: "2风室",
      airFlow: coolerData.chamber2AirFlow,
      pressure: coolerData.chamber2Pressure,
      color: "bg-industrial-500",
    },
    {
      name: "3风室",
      airFlow: coolerData.chamber3AirFlow,
      pressure: coolerData.chamber3Pressure,
      color: "bg-status-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">熟料冷却模块</h1>
        <p className="text-sm text-slate-400 mt-1">
          监控篦冷机运行状态、冷却效率及各风室参数
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="篦速"
          value={coolerData.grateSpeed.toFixed(1)}
          unit="次/min"
          icon={Activity}
          status="normal"
          trend="stable"
          trendValue="±0.5"
        />
        <KPICard
          title="料层厚度"
          value={coolerData.bedThickness}
          unit="mm"
          icon={Layers}
          status={coolerData.bedThickness > 700 ? "warning" : "normal"}
          trend="stable"
          trendValue="±20"
        />
        <KPICard
          title="总风量"
          value={(coolerData.chamber1AirFlow + coolerData.chamber2AirFlow + coolerData.chamber3AirFlow).toFixed(1)}
          unit="万m³/h"
          icon={Wind}
          status="normal"
          trend="up"
          trendValue="+1.2"
        />
        <KPICard
          title="平均风压"
          value={((coolerData.chamber1Pressure + coolerData.chamber2Pressure + coolerData.chamber3Pressure) / 3).toFixed(2)}
          unit="kPa"
          icon={Zap}
          status="normal"
          trend="stable"
          trendValue="±0.3"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <ThermometerSun className="w-5 h-5 text-status-warning" />
            熟料出料温度
          </h3>
          <GaugeChart
            value={coolerData.clinkerOutletTemp}
            max={150}
            min={50}
            unit="°C"
            height={260}
            warningThreshold={100}
            alarmThreshold={120}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Gauge className="w-5 h-5 text-status-normal" />
            冷却效率
          </h3>
          <GaugeChart
            value={coolerData.coolingEfficiency}
            max={100}
            min={50}
            unit="%"
            height={260}
            warningThreshold={75}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Wind className="w-5 h-5 text-industrial-400" />
            各风室风量风压
          </h3>
          <div className="space-y-4 mt-2">
            {chamberData.map((chamber) => (
              <div key={chamber.name} className="p-3 bg-slate-700/40 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-200">{chamber.name}</span>
                  <div className={`w-2 h-2 rounded-full ${chamber.color}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">风量</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {chamber.airFlow.toFixed(1)}
                      <span className="text-xs font-normal text-slate-400 ml-1">万m³/h</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">风压</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {chamber.pressure.toFixed(2)}
                      <span className="text-xs font-normal text-slate-400 ml-1">kPa</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${chamber.color} transition-all duration-500`}
                    style={{ width: `${(chamber.airFlow / 30) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <ThermometerSun className="w-5 h-5 text-status-warning" />
            冷却温度趋势
          </h3>
          <LineChart
            xAxisData={timeLabels}
            series={[
              {
                name: "进气温度(°C)",
                data: inletTempData,
                color: "#EF4444",
                smooth: true,
              },
              {
                name: "出料温度(°C)",
                data: outletTempData,
                color: "#3B82F6",
                smooth: true,
              },
            ]}
            height={300}
            showLegend={true}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Wind className="w-5 h-5 text-industrial-400" />
            风量风压参数矩阵
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>风室</th>
                  <th>风量(万m³/h)</th>
                  <th>风压(kPa)</th>
                  <th>风温(°C)</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">1风室</td>
                  <td>{coolerData.chamber1AirFlow.toFixed(1)}</td>
                  <td>{coolerData.chamber1Pressure.toFixed(2)}</td>
                  <td>{(500 + Math.random() * 100).toFixed(0)}</td>
                  <td>
                    <span className="badge bg-status-normal/20 text-status-normal">正常</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">2风室</td>
                  <td>{coolerData.chamber2AirFlow.toFixed(1)}</td>
                  <td>{coolerData.chamber2Pressure.toFixed(2)}</td>
                  <td>{(300 + Math.random() * 80).toFixed(0)}</td>
                  <td>
                    <span className="badge bg-status-normal/20 text-status-normal">正常</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">3风室</td>
                  <td>{coolerData.chamber3AirFlow.toFixed(1)}</td>
                  <td>{coolerData.chamber3Pressure.toFixed(2)}</td>
                  <td>{(150 + Math.random() * 60).toFixed(0)}</td>
                  <td>
                    <span className="badge bg-status-warning/20 text-status-warning">注意</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-slate-300">合计/平均</td>
                  <td className="text-industrial-400 font-semibold">
                    {(coolerData.chamber1AirFlow + coolerData.chamber2AirFlow + coolerData.chamber3AirFlow).toFixed(1)}
                  </td>
                  <td className="text-industrial-400 font-semibold">
                    {((coolerData.chamber1Pressure + coolerData.chamber2Pressure + coolerData.chamber3Pressure) / 3).toFixed(2)}
                  </td>
                  <td className="text-industrial-400 font-semibold">
                    {(320 + Math.random() * 40).toFixed(0)}
                  </td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-industrial-400" />
              <span className="font-medium">系统提示：</span>
              <span className="text-slate-400">3风室风量偏低，建议检查风机运行状态</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import {
  Filter,
  CircleDot,
  Square,
  Zap,
  Package,
  TrendingUp,
  PieChart as PieChartIcon,
  History,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const THRESHOLDS = {
  sieve008: 12,
  sieve002: 1.5,
  specificSurface: 330,
};

export default function Grinding() {
  const { realtimeData, historyData } = useAppStore();
  const { grindingData } = realtimeData;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  };

  const grindingTrendOption: EChartsOption = useMemo(() => {
    const timestamps = historyData.grindingData.map((d) => formatTime(d.timestamp));
    const sieve008 = historyData.grindingData.map((d) => d.sieveResidue_008);
    const sieve002 = historyData.grindingData.map((d) => d.sieveResidue_002);
    const specificSurface = historyData.grindingData.map((d) => d.specificSurface);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1E293B",
        borderColor: "#334155",
        textStyle: { color: "#F1F5F9" },
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#334155",
          },
        },
      },
      legend: {
        data: ["0.08mm筛余(%)", "0.02mm筛余(%)", "比表面积(m²/kg)"],
        textStyle: { color: "#94A3B8" },
        top: 0,
        right: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#475569" } },
        axisLabel: { color: "#94A3B8", fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "筛余(%)",
          nameTextStyle: { color: "#94A3B8", fontSize: 12 },
          axisLine: { show: false },
          axisLabel: { color: "#94A3B8", fontSize: 12 },
          splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
        },
        {
          type: "value",
          name: "比表面积(m²/kg)",
          nameTextStyle: { color: "#94A3B8", fontSize: 12 },
          axisLine: { show: false },
          axisLabel: { color: "#94A3B8", fontSize: 12 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "0.08mm筛余(%)",
          type: "line",
          data: sieve008,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2, color: "#3B82F6" },
          itemStyle: { color: "#3B82F6" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#3B82F633" },
                { offset: 1, color: "#3B82F600" },
              ],
            },
          },
          emphasis: { focus: "series" },
        },
        {
          name: "0.02mm筛余(%)",
          type: "line",
          data: sieve002,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2, color: "#10B981" },
          itemStyle: { color: "#10B981" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#10B98133" },
                { offset: 1, color: "#10B98100" },
              ],
            },
          },
          emphasis: { focus: "series" },
        },
        {
          name: "比表面积(m²/kg)",
          type: "line",
          yAxisIndex: 1,
          data: specificSurface,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 2, color: "#F59E0B" },
          itemStyle: { color: "#F59E0B" },
          emphasis: { focus: "series" },
        },
      ],
    };
  }, [historyData.grindingData]);

  const passRateData = useMemo(() => {
    const total = historyData.grindingData.length;
    const sieve008Pass = historyData.grindingData.filter(
      (d) => d.sieveResidue_008 <= THRESHOLDS.sieve008
    ).length;
    const sieve002Pass = historyData.grindingData.filter(
      (d) => d.sieveResidue_002 <= THRESHOLDS.sieve002
    ).length;
    const specificSurfacePass = historyData.grindingData.filter(
      (d) => d.specificSurface >= THRESHOLDS.specificSurface
    ).length;

    return {
      total,
      sieve008Pass,
      sieve008PassRate: ((sieve008Pass / total) * 100).toFixed(1),
      sieve002Pass,
      sieve002PassRate: ((sieve002Pass / total) * 100).toFixed(1),
      specificSurfacePass,
      specificSurfacePassRate: ((specificSurfacePass / total) * 100).toFixed(1),
    };
  }, [historyData.grindingData]);

  const passRatePieOption: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "#1E293B",
        borderColor: "#334155",
        textStyle: { color: "#F1F5F9" },
        formatter: "{b}: {c}次 ({d}%)",
      },
      legend: {
        orient: "horizontal",
        bottom: "0%",
        textStyle: { color: "#94A3B8" },
        itemGap: 16,
      },
      color: ["#10B981", "#EF4444"],
      series: [
        {
          name: "合格率",
          type: "pie",
          radius: ["50%", "75%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#1E293B",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "center",
            formatter: `{a|${passRateData.sieve008PassRate}%}\n{b|0.08mm合格率}`,
            rich: {
              a: {
                color: "#10B981",
                fontSize: 28,
                fontWeight: "bold",
                lineHeight: 36,
              },
              b: {
                color: "#94A3B8",
                fontSize: 12,
              },
            },
          },
          emphasis: {
            label: {
              show: true,
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: passRateData.sieve008Pass, name: "合格" },
            { value: passRateData.total - passRateData.sieve008Pass, name: "不合格" },
          ],
        },
      ],
    };
  }, [passRateData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="0.08mm筛余"
          value={grindingData.sieveResidue_008}
          unit="%"
          status={grindingData.sieveResidue_008 > THRESHOLDS.sieve008 ? "warning" : "normal"}
          icon={Filter}
          trend="stable"
          trendValue="±0.2%"
        />
        <KPICard
          title="0.02mm筛余"
          value={grindingData.sieveResidue_002}
          unit="%"
          status={grindingData.sieveResidue_002 > THRESHOLDS.sieve002 ? "warning" : "normal"}
          icon={CircleDot}
          trend="down"
          trendValue="-0.1%"
        />
        <KPICard
          title="比表面积"
          value={grindingData.specificSurface}
          unit="m²/kg"
          status={grindingData.specificSurface < THRESHOLDS.specificSurface ? "warning" : "normal"}
          icon={Square}
          trend="up"
          trendValue="+5"
        />
        <KPICard
          title="磨机电流"
          value={grindingData.millCurrent}
          unit="A"
          status={grindingData.millCurrent > 200 ? "warning" : "normal"}
          icon={Zap}
          trend="up"
          trendValue="+3A"
        />
        <KPICard
          title="喂料量"
          value={grindingData.feedRate}
          unit="t/h"
          status="normal"
          icon={Package}
          trend="stable"
          trendValue="±0"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 data-card">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-industrial-400" />
            24小时细度趋势
          </h3>
          <ReactECharts
            option={grindingTrendOption}
            style={{ height: 320, width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <PieChartIcon className="w-5 h-5 text-industrial-400" />
            合格率统计
          </h3>
          <ReactECharts
            option={passRatePieOption}
            style={{ height: 240, width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">0.08mm</p>
              <p className="text-lg font-bold text-status-normal">{passRateData.sieve008PassRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">0.02mm</p>
              <p className="text-lg font-bold text-status-normal">{passRateData.sieve002PassRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">比表面积</p>
              <p className="text-lg font-bold text-status-normal">{passRateData.specificSurfacePassRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="data-card">
        <h3 className="section-title">
          <History className="w-5 h-5 text-industrial-400" />
          历史粉磨数据
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>0.08mm筛余(%)</th>
                <th>0.02mm筛余(%)</th>
                <th>比表面积(m²/kg)</th>
                <th>磨机电流(A)</th>
                <th>喂料量(t/h)</th>
              </tr>
            </thead>
            <tbody>
              {historyData.grindingData.slice(-12).reverse().map((item) => (
                <tr key={item.id}>
                  <td className="text-slate-300">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className={item.sieveResidue_008 > THRESHOLDS.sieve008 ? "text-status-warning font-medium" : ""}>
                    {item.sieveResidue_008.toFixed(1)}
                  </td>
                  <td className={item.sieveResidue_002 > THRESHOLDS.sieve002 ? "text-status-warning font-medium" : ""}>
                    {item.sieveResidue_002.toFixed(2)}
                  </td>
                  <td className={item.specificSurface < THRESHOLDS.specificSurface ? "text-status-warning font-medium" : ""}>
                    {item.specificSurface}
                  </td>
                  <td>{item.millCurrent}</td>
                  <td>{item.feedRate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

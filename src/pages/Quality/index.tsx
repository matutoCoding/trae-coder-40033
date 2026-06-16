import { useState, useMemo, Fragment } from "react";
import { useAppStore } from "@/store";
import KPICard from "@/components/cards/KPICard";
import {
  Beaker,
  Scale,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  ClipboardList,
  Send,
  PieChart,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { KilnData, PreheaterData, CoolerData, ProductionStatus } from "@/types";

function getTrendRange<T extends { timestamp: string }>(
  arr: T[],
  targetTs: string,
  halfSpan: number
): { data: T[]; centerIndex: number } {
  if (arr.length === 0) return { data: [], centerIndex: -1 };
  const sorted = [...arr].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const target = new Date(targetTs).getTime();
  let closestIdx = 0;
  let minDiff = Math.abs(new Date(sorted[0].timestamp).getTime() - target);
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(new Date(sorted[i].timestamp).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  const start = Math.max(0, closestIdx - halfSpan);
  const data = sorted.slice(start, start + halfSpan * 2 + 1);
  const centerIndex = closestIdx - start;
  return { data, centerIndex: Math.min(centerIndex, data.length - 1) };
}

function buildSparklineOption(
  values: number[],
  centerIndex: number,
  color: string,
  label: string,
  unit: string
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9", fontSize: 11 },
      formatter: (params: unknown) => {
        const p = (params as { name: string; value: number }[])[0];
        return p ? `${label}: ${p.value}${unit}` : "";
      },
    },
    grid: { left: 4, right: 4, top: 20, bottom: 4, containLabel: false },
    xAxis: {
      type: "category",
      data: values.map((_, i) => `${i}`),
      axisLine: { show: false },
      axisTick: { show: true, lineStyle: { color: "#475569" }, length: 3 },
      axisLabel: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: true, lineStyle: { color: "#475569" }, length: 3 },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    graphic: [
      {
        type: "text",
        left: 6,
        top: 2,
        style: {
          text: `${label} (${unit})`,
          fill: "#94A3B8",
          fontSize: 11,
        },
      },
    ],
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 1.5, color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + "33" },
              { offset: 1, color: color + "00" },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#F59E0B", type: "dashed", width: 1 },
          data: [{ xAxis: centerIndex }],
          label: { show: false },
        },
      },
    ],
  };
}

function SparklineGrid({ qualityTs }: { qualityTs: string }) {
  const { historyData } = useAppStore();

  const sparklines = useMemo(() => {
    const halfSpan = 3;
    const kilnRange = getTrendRange(historyData.kilnData, qualityTs, halfSpan);
    const preheaterRange = getTrendRange(historyData.preheaterData, qualityTs, halfSpan);
    const coolerRange = getTrendRange(historyData.coolerData, qualityTs, halfSpan);

    return [
      {
        label: "窑速",
        unit: "r/min",
        values: kilnRange.data.map((d) => d.kilnSpeed),
        centerIndex: kilnRange.centerIndex,
        color: "#3B82F6",
      },
      {
        label: "窑电流",
        unit: "A",
        values: kilnRange.data.map((d) => d.kilnCurrent),
        centerIndex: kilnRange.centerIndex,
        color: "#8B5CF6",
      },
      {
        label: "分解炉温度",
        unit: "℃",
        values: preheaterRange.data.map((d) => d.calcinerTemp),
        centerIndex: preheaterRange.centerIndex,
        color: "#F59E0B",
      },
      {
        label: "熟料冷却温度",
        unit: "℃",
        values: coolerRange.data.map((d) => d.clinkerOutletTemp),
        centerIndex: coolerRange.centerIndex,
        color: "#10B981",
      },
    ];
  }, [historyData, qualityTs]);

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {sparklines.map((s) => (
        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2">
          <ReactECharts
            option={buildSparklineOption(s.values, s.centerIndex, s.color, s.label, s.unit)}
            style={{ height: 80, width: "100%" }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Quality() {
  const { realtimeData, historyData } = useAppStore();
  const { qualityData, kpiData } = realtimeData;
  const qualityHistory = historyData.qualityData;
  const { kilnData, preheaterData, coolerData, productionStatus } = historyData;

  const [formData, setFormData] = useState({
    sampleNo: `S${Date.now().toString().slice(-6)}`,
    fCao: "",
    literWeight: "",
    strength_3d: "",
    strength_28d: "",
    inspector: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const findClosestRecord = <T extends { timestamp: string }>(
    arr: T[],
    targetTs: string
  ): T | null => {
    if (arr.length === 0) return null;
    const target = new Date(targetTs).getTime();
    let closest = arr[0];
    let minDiff = Math.abs(new Date(closest.timestamp).getTime() - target);
    for (let i = 1; i < arr.length; i++) {
      const diff = Math.abs(new Date(arr[i].timestamp).getTime() - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = arr[i];
      }
    }
    return closest;
  };

  const getTraceParams = (qualityTs: string) => {
    const kiln = findClosestRecord(kilnData, qualityTs);
    const preheater = findClosestRecord(preheaterData, qualityTs);
    const cooler = findClosestRecord(coolerData, qualityTs);
    const production = findClosestRecord(productionStatus, qualityTs);
    return {
      kilnSpeed: kiln?.kilnSpeed,
      kilnCurrent: kiln?.kilnCurrent,
      calcinerTemp: preheater?.calcinerTemp,
      calcinerCoalRate: preheater?.calcinerCoalRate,
      kilnHeadCoalRate: kiln?.kilnHeadCoalRate,
      clinkerOutletTemp: cooler?.clinkerOutletTemp,
      coolingEfficiency: cooler?.coolingEfficiency,
      feedRate: production?.feedRate,
    };
  };

  const formatValue = (value: number | undefined, decimals = 2) => {
    if (value === undefined) return "--";
    return value.toFixed(decimals);
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const timeLabels = qualityHistory.map((d) => formatTime(d.timestamp));
  const fCaoData = qualityHistory.map((d) => d.fCao);
  const literWeightData = qualityHistory.map((d) => d.literWeight);

  const FCAO_UCL = 2.0;
  const FCAO_LCL = 0.8;
  const FCAO_CL = 1.4;

  const fCaoControlOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9" },
      axisPointer: { type: "cross", label: { backgroundColor: "#334155" } },
    },
    legend: {
      data: ["fCao", "控制上限", "控制下限", "中心线"],
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
    yAxis: {
      type: "value",
      name: "fCao(%)",
      nameTextStyle: { color: "#94A3B8", fontSize: 12 },
      min: 0.5,
      max: 2.5,
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 12 },
      splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
    },
    series: [
      {
        name: "fCao",
        type: "line",
        data: fCaoData,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: "#3B82F6" },
        itemStyle: { color: "#3B82F6" },
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
        name: "控制上限",
        type: "line",
        data: timeLabels.map(() => FCAO_UCL),
        smooth: false,
        symbol: "none",
        lineStyle: { width: 1, color: "#EF4444", type: "dashed" },
      },
      {
        name: "控制下限",
        type: "line",
        data: timeLabels.map(() => FCAO_LCL),
        smooth: false,
        symbol: "none",
        lineStyle: { width: 1, color: "#EF4444", type: "dashed" },
      },
      {
        name: "中心线",
        type: "line",
        data: timeLabels.map(() => FCAO_CL),
        smooth: false,
        symbol: "none",
        lineStyle: { width: 1, color: "#10B981", type: "dotted" },
      },
    ],
  };

  const literWeightHistogramOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9" },
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 30,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["1050-", "1100-", "1150-", "1200-", "1250-", "1300-", "1350+"],
      axisLine: { lineStyle: { color: "#475569" } },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
      axisTick: { show: false },
      name: "立升重(g/L)",
      nameTextStyle: { color: "#94A3B8", fontSize: 12 },
    },
    yAxis: {
      type: "value",
      name: "频数",
      nameTextStyle: { color: "#94A3B8", fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 12 },
      splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
    },
    series: [
      {
        type: "bar",
        data: [2, 5, 8, 12, 6, 3, 1],
        barWidth: "60%",
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#8B5CF6" },
              { offset: 1, color: "#8B5CF666" },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const fCaoPassOption: EChartsOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9" },
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      textStyle: { color: "#94A3B8" },
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "75%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: "#1E293B", borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold", color: "#F1F5F9" },
        },
        data: [
          { value: kpiData.fCaoPassRate, name: "合格", itemStyle: { color: "#10B981" } },
          { value: 100 - kpiData.fCaoPassRate, name: "不合格", itemStyle: { color: "#EF4444" } },
        ],
      },
    ],
  };

  const literWeightPassOption: EChartsOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      textStyle: { color: "#F1F5F9" },
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      textStyle: { color: "#94A3B8" },
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "75%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: "#1E293B", borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold", color: "#F1F5F9" },
        },
        data: [
          { value: kpiData.literWeightPassRate, name: "合格", itemStyle: { color: "#3B82F6" } },
          { value: 100 - kpiData.literWeightPassRate, name: "不合格", itemStyle: { color: "#F59E0B" } },
        ],
      },
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        sampleNo: `S${Date.now().toString().slice(-6)}`,
        fCao: "",
        literWeight: "",
        strength_3d: "",
        strength_28d: "",
        inspector: "",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">质量控制模块</h1>
        <p className="text-sm text-slate-400 mt-1">
          熟料质量指标实时监控、过程控制及检测数据管理
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="游离钙 fCao"
          value={qualityData.fCao.toFixed(2)}
          unit="%"
          icon={Beaker}
          status={qualityData.fCao > 2.0 ? "alarm" : qualityData.fCao > 1.8 ? "warning" : "normal"}
          trend={qualityData.fCao > 1.5 ? "up" : "stable"}
          trendValue={qualityData.fCao > 1.5 ? "+0.15%" : "±0.05%"}
        />
        <KPICard
          title="立升重"
          value={qualityData.literWeight}
          unit="g/L"
          icon={Scale}
          status={qualityData.literWeight < 1150 ? "warning" : "normal"}
          trend="stable"
          trendValue="±15"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-industrial-400" />
            fCao 控制图
          </h3>
          <ReactECharts
            option={fCaoControlOption}
            style={{ height: 300, width: "100%" }}
          />
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            立升重分布直方图
          </h3>
          <ReactECharts
            option={literWeightHistogramOption}
            style={{ height: 300, width: "100%" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <PieChart className="w-5 h-5 text-status-normal" />
            fCao 合格率
          </h3>
          <div className="flex items-center justify-between">
            <ReactECharts
              option={fCaoPassOption}
              style={{ height: 200, width: "60%" }}
            />
            <div className="text-center pr-4">
              <p className="text-4xl font-bold text-status-normal">
                {kpiData.fCaoPassRate.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-400 mt-1">合格率</p>
              <div className="mt-3 flex items-center gap-1 justify-center">
                <CheckCircle className="w-4 h-4 text-status-normal" />
                <span className="text-xs text-slate-400">控制范围: 0.8~2.0%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <PieChart className="w-5 h-5 text-industrial-400" />
            立升重合格率
          </h3>
          <div className="flex items-center justify-between">
            <ReactECharts
              option={literWeightPassOption}
              style={{ height: 200, width: "60%" }}
            />
            <div className="text-center pr-4">
              <p className="text-4xl font-bold text-industrial-400">
                {kpiData.literWeightPassRate.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-400 mt-1">合格率</p>
              <div className="mt-3 flex items-center gap-1 justify-center">
                <CheckCircle className="w-4 h-4 text-industrial-400" />
                <span className="text-xs text-slate-400">控制范围: ≥1150 g/L</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="data-card">
          <h3 className="section-title">
            <ClipboardList className="w-5 h-5 text-industrial-400" />
            质量检测数据录入
          </h3>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-status-normal mb-4" />
              <p className="text-xl font-semibold text-slate-100">提交成功</p>
              <p className="text-sm text-slate-400 mt-1">检测数据已录入系统</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">样品编号</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={formData.sampleNo}
                    onChange={(e) => setFormData({ ...formData, sampleNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">检测员</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="请输入检测员"
                    value={formData.inspector}
                    onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    游离钙 fCao (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field w-full"
                    placeholder="如: 1.35"
                    value={formData.fCao}
                    onChange={(e) => setFormData({ ...formData, fCao: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    立升重 (g/L)
                  </label>
                  <input
                    type="number"
                    className="input-field w-full"
                    placeholder="如: 1250"
                    value={formData.literWeight}
                    onChange={(e) => setFormData({ ...formData, literWeight: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    3天强度 (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field w-full"
                    placeholder="如: 32.5"
                    value={formData.strength_3d}
                    onChange={(e) => setFormData({ ...formData, strength_3d: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    28天强度 (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field w-full"
                    placeholder="如: 58.0"
                    value={formData.strength_28d}
                    onChange={(e) => setFormData({ ...formData, strength_28d: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0" />
                <span className="text-xs text-slate-400">
                  提示：所有数据仅用于示例演示，不会保存到数据库。
                </span>
              </div>
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                <Send className="w-4 h-4" />
                提交检测数据
              </button>
            </form>
          )}
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <FileText className="w-5 h-5 text-industrial-400" />
            历史质量数据
          </h3>
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-industrial-400"></span>
            点击记录查看对应时段生产参数追溯
          </p>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>时间</th>
                  <th>样品号</th>
                  <th>fCao(%)</th>
                  <th>立升重</th>
                  <th>3d强度</th>
                  <th>检测员</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {qualityHistory.slice(0, 10).map((d, idx) => {
                  const isFCaoPass = d.fCao >= 0.8 && d.fCao <= 2.0;
                  const isLWPass = d.literWeight >= 1150;
                  const allPass = isFCaoPass && isLWPass;
                  const isExpanded = expandedIndex === idx;
                  const traceParams = isExpanded ? getTraceParams(d.timestamp) : null;
                  return (
                    <Fragment key={idx}>
                      <tr
                        className="cursor-pointer hover:bg-slate-700/40 transition-colors"
                        onClick={() => toggleExpand(idx)}
                      >
                        <td className="w-8">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-industrial-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </td>
                        <td className="text-xs text-slate-400">{formatTime(d.timestamp)}</td>
                        <td className="font-mono text-xs">{d.sampleNo}</td>
                        <td className={isFCaoPass ? "" : "text-status-alarm"}>
                          {d.fCao.toFixed(2)}
                        </td>
                        <td className={isLWPass ? "" : "text-status-warning"}>
                          {d.literWeight}
                        </td>
                        <td>{d.strength_3d.toFixed(1)}</td>
                        <td className="text-slate-400">{d.inspector}</td>
                        <td>
                          <span
                            className={`badge ${
                              allPass
                                ? "bg-status-normal/20 text-status-normal"
                                : "bg-status-warning/20 text-status-warning"
                            }`}
                          >
                            {allPass ? "合格" : "待复核"}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && traceParams && (
                        <tr className="bg-slate-800/60">
                          <td colSpan={8} className="py-4 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">窑速</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.kilnSpeed, 2)}
                                  <span className="text-xs text-slate-500 ml-1">r/min</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">窑电流</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.kilnCurrent, 0)}
                                  <span className="text-xs text-slate-500 ml-1">A</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">分解炉温度</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.calcinerTemp, 0)}
                                  <span className="text-xs text-slate-500 ml-1">℃</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">分解炉喂煤量</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.calcinerCoalRate, 2)}
                                  <span className="text-xs text-slate-500 ml-1">t/h</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">窑头喂煤量</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.kilnHeadCoalRate, 2)}
                                  <span className="text-xs text-slate-500 ml-1">t/h</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">熟料冷却温度</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.clinkerOutletTemp, 0)}
                                  <span className="text-xs text-slate-500 ml-1">℃</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">冷却效率</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.coolingEfficiency, 1)}
                                  <span className="text-xs text-slate-500 ml-1">%</span>
                                </p>
                              </div>
                              <div className="bg-slate-700/40 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">喂料量</p>
                                <p className="font-mono text-lg text-slate-100">
                                  {formatValue(traceParams.feedRate, 1)}
                                  <span className="text-xs text-slate-500 ml-1">t/h</span>
                                </p>
                              </div>
                            </div>
                            <SparklineGrid qualityTs={d.timestamp} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, Fragment, useEffect, useCallback, useRef } from "react";
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
  X,
  Check,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { KilnData, PreheaterData, CoolerData, ProductionStatus } from "@/types";

interface QualityReview {
  id: string;
  qualityId: string;
  qualityTimestamp: string;
  reason: string;
  relatedParams: string[];
  analysis: string;
  suggestion: string;
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}

const REVIEW_STORAGE_KEY = "cement_quality_reviews";

function loadReviews(): QualityReview[] {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function persistReviews(reviews: QualityReview[]) {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
  } catch {}
}

const PARAM_RANGES: Record<string, { min: number; max: number }> = {
  kilnSpeed: { min: 3.0, max: 4.0 },
  kilnCurrent: { min: 500, max: 700 },
  calcinerTemp: { min: 870, max: 920 },
  clinkerOutletTemp: { min: 65, max: 110 },
  coalRate: { min: 4.5, max: 7.0 },
};

const PARAM_LABELS: Record<string, string> = {
  kilnSpeed: "窑速波动",
  kilnCurrent: "窑电流异常",
  calcinerTemp: "分解炉温度偏高",
  clinkerOutletTemp: "冷却温度偏高",
  coalRate: "喂煤量异常",
};

const REVIEW_REASONS = ["fCao超标", "立升重偏低", "波动异常", "其他"];

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
  const [reviews, setReviews] = useState<QualityReview[]>(loadReviews);
  const [showReviewForm, setShowReviewForm] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({
    reason: "",
    relatedParams: [] as string[],
    analysis: "",
    suggestion: "",
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const historyTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistReviews(reviews);
  }, [reviews]);

  const getReviewForRecord = useCallback(
    (sampleNo: string, timestamp: string) => {
      return reviews.find((r) => r.qualityId === sampleNo && r.qualityTimestamp === timestamp);
    },
    [reviews]
  );

  const autoDetectParams = useCallback(
    (qualityTs: string): string[] => {
      const params = getTraceParams(qualityTs);
      const detected: string[] = [];
      if (params.kilnSpeed !== undefined) {
        const r = PARAM_RANGES.kilnSpeed;
        if (params.kilnSpeed < r.min || params.kilnSpeed > r.max) detected.push("kilnSpeed");
      }
      if (params.kilnCurrent !== undefined) {
        const r = PARAM_RANGES.kilnCurrent;
        if (params.kilnCurrent < r.min || params.kilnCurrent > r.max) detected.push("kilnCurrent");
      }
      if (params.calcinerTemp !== undefined) {
        const r = PARAM_RANGES.calcinerTemp;
        if (params.calcinerTemp < r.min || params.calcinerTemp > r.max) detected.push("calcinerTemp");
      }
      if (params.clinkerOutletTemp !== undefined) {
        const r = PARAM_RANGES.clinkerOutletTemp;
        if (params.clinkerOutletTemp < r.min || params.clinkerOutletTemp > r.max) detected.push("clinkerOutletTemp");
      }
      if (params.calcinerCoalRate !== undefined) {
        const r = PARAM_RANGES.coalRate;
        if (params.calcinerCoalRate < r.min || params.calcinerCoalRate > r.max) detected.push("coalRate");
      }
      return detected;
    },
    [kilnData, preheaterData, coolerData, productionStatus]
  );

  const openReviewForm = (idx: number) => {
    const d = qualityHistory[idx];
    const detected = autoDetectParams(d.timestamp);
    setReviewForm({
      reason: "",
      relatedParams: detected,
      analysis: "",
      suggestion: "",
    });
    setShowReviewForm(idx);
  };

  const submitReview = (idx: number) => {
    const d = qualityHistory[idx];
    if (!reviewForm.reason) return;
    const newReview: QualityReview = {
      id: `review-${Date.now()}`,
      qualityId: d.sampleNo,
      qualityTimestamp: d.timestamp,
      reason: reviewForm.reason,
      relatedParams: reviewForm.relatedParams,
      analysis: reviewForm.analysis,
      suggestion: reviewForm.suggestion,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [...prev, newReview]);
    setShowReviewForm(null);
  };

  const completeReview = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, status: "completed" as const, completedAt: new Date().toISOString() } : r
      )
    );
  };

  const toggleRelatedParam = (param: string) => {
    setReviewForm((prev) => ({
      ...prev,
      relatedParams: prev.relatedParams.includes(param)
        ? prev.relatedParams.filter((p) => p !== param)
        : [...prev.relatedParams, param],
    }));
  };

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

  const findQualityIndex = (sampleNo: string, timestamp: string): number => {
    return qualityHistory.findIndex(
      (q) => q.sampleNo === sampleNo && q.timestamp === timestamp
    );
  };

  const expandAndScrollTo = (sampleNo: string, timestamp: string) => {
    const idx = findQualityIndex(sampleNo, timestamp);
    if (idx >= 0) {
      setExpandedIndex(idx);
      setTimeout(() => {
        const el = historyTableRef.current?.querySelector(
          `tbody tr:nth-child(${idx * 2 + 1})`
        ) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => (reasonFilter === "all" ? true : r.reason === reasonFilter))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [reviews, statusFilter, reasonFilter]);

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

      <div className="data-card">
        <h3 className="section-title">
          <ClipboardList className="w-5 h-5 text-industrial-400" />
          质量复核单列表
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "completed")}
                className="input-field text-xs py-1.5 px-2 w-32"
              >
                <option value="all">全部</option>
                <option value="pending">待复核</option>
                <option value="completed">复核完成</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">原因</label>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="input-field text-xs py-1.5 px-2 w-36"
              >
                <option value="all">全部</option>
                {REVIEW_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            共 <span className="text-slate-200 font-semibold">{filteredReviews.length}</span> 条复核单
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>发起时间</th>
                <th>关联检测</th>
                <th>复核原因</th>
                <th>关联参数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    暂无复核单
                  </td>
                </tr>
              ) : (
                  filteredReviews.map((review) => (
                    <tr key={review.id}>
                      <td className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <button
                          onClick={() => expandAndScrollTo(review.qualityId, review.qualityTimestamp)}
                          className="text-xs text-industrial-400 hover:text-industrial-300 hover:underline font-mono"
                        >
                          {review.qualityId}
                          <span className="text-slate-500 ml-2">
                            {formatTime(review.qualityTimestamp)}
                          </span>
                        </button>
                      </td>
                      <td className="text-xs">{review.reason}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {review.relatedParams.length > 0 ? (
                            review.relatedParams.map((p) => (
                              <span
                                key={p} className="badge bg-slate-700 text-slate-300">
                                {PARAM_LABELS[p] || p}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            review.status === "completed"
                              ? "bg-status-normal/20 text-status-normal"
                              : "bg-status-warning/20 text-status-warning"
                          }`}
                        >
                          {review.status === "completed" ? "复核完成" : "待复核"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => expandAndScrollTo(review.qualityId, review.qualityTimestamp)}
                            className="px-2 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                          >
                            查看详情
                          </button>
                          {review.status === "pending" && (
                            <button
                              onClick={() => completeReview(review.id)}
                              className="px-2 py-1 text-xs font-medium bg-industrial-500/20 hover:bg-industrial-500/30 text-industrial-400 rounded transition-colors"
                            >
                              完成复核
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
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
          <div className="overflow-x-auto" ref={historyTableRef}>
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
                          <div className="flex flex-col gap-1">
                            <span
                              className={`badge ${
                                allPass
                                  ? "bg-status-normal/20 text-status-normal"
                                  : "bg-status-warning/20 text-status-warning"
                              }`}
                            >
                              {allPass ? "合格" : "待复核"}
                            </span>
                            {(() => {
                              const review = getReviewForRecord(d.sampleNo, d.timestamp);
                              if (!review) return null;
                              return (
                                <span
                                  className={`badge ${
                                    review.status === "completed"
                                      ? "bg-industrial-500/20 text-industrial-400"
                                      : "bg-amber-500/20 text-amber-400"
                                  }`}
                                >
                                  {review.status === "completed" ? "复核完成" : "已发起复核"}
                                </span>
                              );
                            })()}
                          </div>
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
                            {(() => {
                              const existingReview = getReviewForRecord(d.sampleNo, d.timestamp);
                              return (
                                <div className="mt-4 pt-3 border-t border-slate-700/50">
                                  {existingReview ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`badge ${
                                            existingReview.status === "completed"
                                              ? "bg-industrial-500/20 text-industrial-400"
                                              : "bg-amber-500/20 text-amber-400"
                                          }`}
                                        >
                                          {existingReview.status === "completed" ? "复核完成" : "待复核"}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                          复核原因: {existingReview.reason}
                                        </span>
                                      </div>
                                      {existingReview.relatedParams.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {existingReview.relatedParams.map((p) => (
                                            <span key={p} className="badge bg-slate-700 text-slate-300">
                                              {PARAM_LABELS[p] || p}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {existingReview.analysis && (
                                        <div className="text-xs text-slate-400">
                                          原因分析: <span className="text-slate-300">{existingReview.analysis}</span>
                                        </div>
                                      )}
                                      {existingReview.suggestion && (
                                        <div className="text-xs text-slate-400">
                                          处理建议: <span className="text-slate-300">{existingReview.suggestion}</span>
                                        </div>
                                      )}
                                      <div className="text-xs text-slate-500">
                                        发起时间: {new Date(existingReview.createdAt).toLocaleString()}
                                      </div>
                                      {existingReview.status === "pending" && (
                                        <button
                                          onClick={() => completeReview(existingReview.id)}
                                          className="px-3 py-1.5 text-xs font-medium bg-industrial-500/20 hover:bg-industrial-500/30 text-industrial-400 rounded transition-colors"
                                        >
                                          <Check className="w-3 h-3 inline mr-1" />
                                          完成复核
                                        </button>
                                      )}
                                      {existingReview.status === "completed" && existingReview.completedAt && (
                                        <div className="text-xs text-industrial-400">
                                          完成时间: {new Date(existingReview.completedAt).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  ) : showReviewForm === idx ? (
                                    <div className="space-y-3">
                                      <div className="text-sm font-medium text-slate-200 mb-2">发起复核</div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">复核原因</label>
                                        <select
                                          value={reviewForm.reason}
                                          onChange={(e) => setReviewForm({ ...reviewForm, reason: e.target.value })}
                                          className="input-field w-full text-sm"
                                        >
                                          <option value="">请选择复核原因</option>
                                          {REVIEW_REASONS.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">关联参数判定</label>
                                        <div className="flex flex-wrap gap-2">
                                          {Object.keys(PARAM_LABELS).map((key) => (
                                            <label
                                              key={key}
                                              className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 bg-slate-700/40 rounded px-2 py-1"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={reviewForm.relatedParams.includes(key)}
                                                onChange={() => toggleRelatedParam(key)}
                                                className="rounded border-slate-600 bg-slate-800 text-industrial-500 focus:ring-industrial-500"
                                              />
                                              {PARAM_LABELS[key]}
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">原因分析</label>
                                        <input
                                          type="text"
                                          value={reviewForm.analysis}
                                          onChange={(e) => setReviewForm({ ...reviewForm, analysis: e.target.value })}
                                          className="input-field w-full text-sm"
                                          placeholder="请输入原因分析"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">处理建议</label>
                                        <input
                                          type="text"
                                          value={reviewForm.suggestion}
                                          onChange={(e) => setReviewForm({ ...reviewForm, suggestion: e.target.value })}
                                          className="input-field w-full text-sm"
                                          placeholder="请输入处理建议"
                                        />
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() => submitReview(idx)}
                                          disabled={!reviewForm.reason}
                                          className="px-3 py-1.5 text-xs font-medium bg-industrial-500 hover:bg-industrial-400 disabled:opacity-40 text-white rounded transition-colors"
                                        >
                                          提交
                                        </button>
                                        <button
                                          onClick={() => setShowReviewForm(null)}
                                          className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => openReviewForm(idx)}
                                      className="px-3 py-1.5 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded transition-colors"
                                    >
                                      发起复核
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
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

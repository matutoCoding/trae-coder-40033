import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store";
import LineChart from "@/components/charts/LineChart";
import GaugeChart from "@/components/charts/GaugeChart";
import {
  PieChart,
  Target,
  TrendingUp,
  History,
  Mountain,
  Droplets,
  Cog,
  Layers,
  Flame as FlameIcon,
  Calculator,
  RotateCcw,
  Plus,
  Minus,
  Save,
  Trash2,
  Check,
  X,
  GitCompare,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { calculateModulus, targetRanges } from "@/utils/formulaCalculator";

interface RatioInput {
  limestone: number;
  clay: number;
  ironPowder: number;
  sandstone: number;
  coalAsh: number;
}

interface RecipePlan {
  id: string;
  name: string;
  ratios: RatioInput;
  createdAt: string;
}

const STORAGE_KEY = "cement_recipe_plans";

const defaultPlans: RecipePlan[] = [
  {
    id: "default-1",
    name: "常规配料方案",
    ratios: { limestone: 80, clay: 12, ironPowder: 3, sandstone: 4, coalAsh: 1 },
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    name: "高KH方案",
    ratios: { limestone: 83, clay: 9, ironPowder: 3, sandstone: 4, coalAsh: 1 },
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    name: "低SM方案",
    ratios: { limestone: 78, clay: 13, ironPowder: 4, sandstone: 4, coalAsh: 1 },
    createdAt: new Date().toISOString(),
  },
];

function loadPlans(): RecipePlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultPlans;
}

function persistPlans(plans: RecipePlan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {}
}

export default function RawMaterial() {
  const { realtimeData, historyData } = useAppStore();
  const { rawMaterial } = realtimeData;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  };

  const targetRatios = {
    limestone: 80,
    clay: 12,
    ironPowder: 3,
    sandstone: 4,
    coalAsh: 1,
  };

  const [adjustRatios, setAdjustRatios] = useState<RatioInput>({
    limestone: rawMaterial.limestone,
    clay: rawMaterial.clay,
    ironPowder: rawMaterial.ironPowder,
    sandstone: rawMaterial.sandstone,
    coalAsh: rawMaterial.coalAsh,
  });

  const [plans, setPlans] = useState<RecipePlan[]>(loadPlans);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [planName, setPlanName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    persistPlans(plans);
  }, [plans]);

  const modulusResult = useMemo(() => calculateModulus(adjustRatios), [adjustRatios]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const planModulus = useMemo(
    () => (selectedPlan ? calculateModulus(selectedPlan.ratios) : null),
    [selectedPlan]
  );

  const rawMaterialRatios = useMemo<RatioInput>(
    () => ({
      limestone: rawMaterial.limestone,
      clay: rawMaterial.clay,
      ironPowder: rawMaterial.ironPowder,
      sandstone: rawMaterial.sandstone,
      coalAsh: rawMaterial.coalAsh,
    }),
    [rawMaterial]
  );

  const rawMaterialModulus = useMemo(
    () => calculateModulus(rawMaterialRatios),
    [rawMaterialRatios]
  );

  const handleRatioChange = (key: keyof RatioInput, value: number) => {
    setAdjustRatios((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, Number(value.toFixed(1)))),
    }));
  };

  const handleIncrement = (key: keyof RatioInput) => {
    handleRatioChange(key, adjustRatios[key] + 0.5);
  };

  const handleDecrement = (key: keyof RatioInput) => {
    handleRatioChange(key, adjustRatios[key] - 0.5);
  };

  const resetToActual = () => {
    setAdjustRatios({
      limestone: rawMaterial.limestone,
      clay: rawMaterial.clay,
      ironPowder: rawMaterial.ironPowder,
      sandstone: rawMaterial.sandstone,
      coalAsh: rawMaterial.coalAsh,
    });
  };

  const savePlan = () => {
    if (!planName.trim()) return;
    const newPlan: RecipePlan = {
      id: `plan-${Date.now()}`,
      name: planName.trim(),
      ratios: { ...adjustRatios },
      createdAt: new Date().toISOString(),
    };
    setPlans((prev) => [...prev, newPlan]);
    setPlanName("");
    setShowSaveForm(false);
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlanId === id) setSelectedPlanId(null);
  };

  const applyPlan = (plan: RecipePlan) => {
    setAdjustRatios({ ...plan.ratios });
    setSelectedPlanId(plan.id);
  };

  const getDiffColor = (diff: number) => {
    const abs = Math.abs(diff);
    if (abs <= 0.5) return "text-status-normal";
    if (abs <= 2) return "text-yellow-400";
    return "text-status-alarm";
  };

  const getDiffBg = (diff: number) => {
    const abs = Math.abs(diff);
    if (abs <= 0.5) return "bg-status-normal/10";
    if (abs <= 2) return "bg-yellow-400/10";
    return "bg-status-alarm/10";
  };

  const adjustMaterials = [
    { name: "石灰石", key: "limestone" as const, icon: Mountain, color: "#3B82F6" },
    { name: "粘土", key: "clay" as const, icon: Droplets, color: "#10B981" },
    { name: "铁粉", key: "ironPowder" as const, icon: Cog, color: "#F59E0B" },
    { name: "砂岩", key: "sandstone" as const, icon: Layers, color: "#8B5CF6" },
    { name: "煤灰", key: "coalAsh" as const, icon: FlameIcon, color: "#EF4444" },
  ];

  const statusColorMap = {
    normal: "text-status-normal",
    warning: "text-status-warning",
    alarm: "text-status-alarm",
  };

  const pieOption: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "#1E293B",
        borderColor: "#334155",
        textStyle: { color: "#F1F5F9" },
        formatter: "{b}: {c}% ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: { color: "#94A3B8" },
        itemGap: 12,
      },
      color: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"],
      series: [
        {
          name: "原料配比",
          type: "pie",
          radius: ["45%", "70%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#1E293B",
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
              color: "#F1F5F9",
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: rawMaterial.limestone, name: "石灰石" },
            { value: rawMaterial.clay, name: "粘土" },
            { value: rawMaterial.ironPowder, name: "铁粉" },
            { value: rawMaterial.sandstone, name: "砂岩" },
            { value: rawMaterial.coalAsh, name: "煤灰" },
          ],
        },
      ],
    };
  }, [rawMaterial]);

  const ratioTrendData = useMemo(() => {
    const timestamps = historyData.rawMaterial.map((d) => formatTime(d.timestamp));
    const kh = historyData.rawMaterial.map((d) => d.kh_value);
    const sm = historyData.rawMaterial.map((d) => d.sm_value);
    const im = historyData.rawMaterial.map((d) => d.im_value);
    return { timestamps, kh, sm, im };
  }, [historyData.rawMaterial]);

  const rawMaterials = [
    { name: "石灰石", key: "limestone", icon: Mountain, color: "#3B82F6", actual: rawMaterial.limestone, target: targetRatios.limestone },
    { name: "粘土", key: "clay", icon: Droplets, color: "#10B981", actual: rawMaterial.clay, target: targetRatios.clay },
    { name: "铁粉", key: "ironPowder", icon: Cog, color: "#F59E0B", actual: rawMaterial.ironPowder, target: targetRatios.ironPowder },
    { name: "砂岩", key: "sandstone", icon: Layers, color: "#8B5CF6", actual: rawMaterial.sandstone, target: targetRatios.sandstone },
    { name: "煤灰", key: "coalAsh", icon: FlameIcon, color: "#EF4444", actual: rawMaterial.coalAsh, target: targetRatios.coalAsh },
  ];

  const getRatioStatus = (actual: number, target: number) => {
    const diff = Math.abs(actual - target);
    if (diff <= 1) return "normal";
    if (diff <= 3) return "warning";
    return "alarm";
  };

  const statusColors = {
    normal: "text-status-normal",
    warning: "text-status-warning",
    alarm: "text-status-alarm",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 data-card">
          <h3 className="section-title">
            <PieChart className="w-5 h-5 text-industrial-400" />
            原料配比
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ height: 280 }}>
              <ReactECharts
                option={pieOption}
                style={{ height: "100%", width: "100%" }}
                opts={{ renderer: "canvas" }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm mb-4 pb-2 border-b border-slate-700">
                <span className="text-slate-400 w-20">原料</span>
                <span className="text-slate-400 w-16 text-right">实际值</span>
                <span className="text-slate-400 w-16 text-right">目标值</span>
                <span className="text-slate-400 w-16 text-right">偏差</span>
              </div>
              {rawMaterials.map((material) => {
                const Icon = material.icon;
                const diff = (material.actual - material.target).toFixed(1);
                const status = getRatioStatus(material.actual, material.target);
                return (
                  <div key={material.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 w-20">
                      <Icon className="w-4 h-4" style={{ color: material.color }} />
                      <span className="text-sm text-slate-200">{material.name}</span>
                    </div>
                    <span className={`text-sm font-medium w-16 text-right ${statusColors[status]}`}>
                      {material.actual}%
                    </span>
                    <span className="text-sm text-slate-400 w-16 text-right">
                      {material.target}%
                    </span>
                    <span className={`text-sm w-16 text-right ${
                      Number(diff) > 0 ? "text-status-warning" : Number(diff) < 0 ? "text-status-alarm" : "text-slate-400"
                    }`}>
                      {Number(diff) > 0 ? "+" : ""}{diff}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="data-card">
          <h3 className="section-title">
            <Target className="w-5 h-5 text-industrial-400" />
            三率值仪表盘
          </h3>
          <div className="space-y-1">
            <GaugeChart
              title="KH 石灰饱和系数"
              value={rawMaterial.kh_value}
              min={0.80}
              max={1.00}
              unit=""
              warningThreshold={0.94}
              alarmThreshold={0.96}
              height={160}
            />
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 px-4 -mt-2">
              <span>下限: 0.88</span>
              <span className="text-status-normal">目标: 0.88~0.94</span>
              <span>上限: 0.96</span>
            </div>
            <GaugeChart
              title="SM 硅率"
              value={rawMaterial.sm_value}
              min={2.0}
              max={3.2}
              unit=""
              warningThreshold={2.7}
              alarmThreshold={2.9}
              height={140}
            />
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 px-4 -mt-2">
              <span>下限: 2.4</span>
              <span className="text-status-normal">目标: 2.4~2.7</span>
              <span>上限: 2.9</span>
            </div>
            <GaugeChart
              title="IM 铝率"
              value={rawMaterial.im_value}
              min={1.0}
              max={2.2}
              unit=""
              warningThreshold={1.7}
              alarmThreshold={1.9}
              height={140}
            />
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 px-4 -mt-2">
              <span>下限: 1.4</span>
              <span className="text-status-normal">目标: 1.4~1.7</span>
              <span>上限: 1.9</span>
            </div>
          </div>
        </div>
      </div>

      <div className="data-card">
        <h3 className="section-title">
          <Calculator className="w-5 h-5 text-industrial-400" />
          配方调整计算器
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">原料配比调整</span>
              <button
                onClick={resetToActual}
                className="flex items-center gap-1 text-xs text-industrial-400 hover:text-industrial-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                重置为实际配比
              </button>
            </div>
            <div className="space-y-3">
              {adjustMaterials.map((material) => {
                const Icon = material.icon;
                return (
                  <div key={material.key} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-20">
                      <Icon className="w-4 h-4" style={{ color: material.color }} />
                      <span className="text-sm text-slate-300">{material.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => handleDecrement(material.key)}
                        className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={adjustRatios[material.key]}
                        onChange={(e) => handleRatioChange(material.key, parseFloat(e.target.value) || 0)}
                        step="0.5"
                        min="0"
                        max="100"
                        className="input-field w-20 text-center"
                      />
                      <button
                        onClick={() => handleIncrement(material.key)}
                        className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-sm text-slate-400">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">总比例</span>
                <span className={`text-lg font-bold ${modulusResult.isValid ? "text-status-normal" : "text-status-alarm"}`}>
                  {modulusResult.total.toFixed(1)}%
                </span>
              </div>
              {!modulusResult.isValid && (
                <p className="text-xs text-status-alarm mt-1">
                  ⚠ 总比例不等于100%，请调整配比
                </p>
              )}
              {showSaveForm ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && savePlan()}
                    className="input-field flex-1 text-xs py-1"
                    placeholder="输入方案名称"
                    autoFocus
                  />
                  <button
                    onClick={savePlan}
                    disabled={!planName.trim()}
                    className="w-7 h-7 rounded bg-industrial-500 hover:bg-industrial-400 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setShowSaveForm(false); setPlanName(""); }}
                    className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="flex items-center gap-1 text-xs text-industrial-400 hover:text-industrial-300 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  保存为方案
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-2">三率值计算结果</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-xs text-slate-400 mb-1">KH</div>
                <div className={`text-xl font-bold ${statusColorMap[modulusResult.khStatus]}`}>
                  {modulusResult.kh.toFixed(3)}
                </div>
                <div className="text-xs text-slate-500 mt-1">石灰饱和系数</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-xs text-slate-400 mb-1">SM</div>
                <div className={`text-xl font-bold ${statusColorMap[modulusResult.smStatus]}`}>
                  {modulusResult.sm.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-1">硅率</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                <div className="text-xs text-slate-400 mb-1">IM</div>
                <div className={`text-xl font-bold ${statusColorMap[modulusResult.imStatus]}`}>
                  {modulusResult.im.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-1">铝率</div>
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">目标范围参考</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">KH</span>
                  <span className="text-status-normal">目标: {targetRanges.kh.lower}~{targetRanges.kh.upper}</span>
                  <span className="text-status-warning">预警: {targetRanges.kh.warnLow}~{targetRanges.kh.warnHigh}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SM</span>
                  <span className="text-status-normal">目标: {targetRanges.sm.lower}~{targetRanges.sm.upper}</span>
                  <span className="text-status-warning">预警: {targetRanges.sm.warnLow}~{targetRanges.sm.warnHigh}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IM</span>
                  <span className="text-status-normal">目标: {targetRanges.im.lower}~{targetRanges.im.upper}</span>
                  <span className="text-status-warning">预警: {targetRanges.im.warnLow}~{targetRanges.im.warnHigh}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400 mb-2">已保存方案</div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-lg p-3 border transition-colors ${
                    selectedPlanId === plan.id
                      ? "border-industrial-500 bg-industrial-500/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => setSelectedPlanId(plan.id)}
                      className="text-sm font-medium text-slate-200 hover:text-industrial-400 transition-colors truncate text-left"
                    >
                      {plan.name}
                    </button>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    石灰石{plan.ratios.limestone}% 粘土{plan.ratios.clay}% 铁粉{plan.ratios.ironPowder}% 砂岩{plan.ratios.sandstone}% 煤灰{plan.ratios.coalAsh}%
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyPlan(plan)}
                      className="flex-1 px-2 py-1 text-xs font-medium bg-industrial-500/20 hover:bg-industrial-500/30 text-industrial-400 rounded transition-colors"
                    >
                      应用
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="px-2 py-1 text-xs font-medium bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-status-alarm rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedPlan && planModulus && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <h4 className="section-title text-sm mb-3">
              <GitCompare className="w-4 h-4 text-industrial-400" />
              现场实际 vs 方案对比（{selectedPlan.name}）
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-2">配比差异</div>
                <div className="space-y-1.5">
                  {adjustMaterials.map((mat) => {
                    const current = rawMaterialRatios[mat.key];
                    const planVal = selectedPlan.ratios[mat.key];
                    const diff = current - planVal;
                    return (
                      <div key={mat.key} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 w-16">{mat.name}</span>
                        <span className="text-slate-300 w-14 text-right">{current}%</span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-slate-300 w-14 text-right">{planVal}%</span>
                        <span className={`w-16 text-right font-medium rounded px-1 ${getDiffColor(diff)} ${getDiffBg(diff)}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-2">三率值差异</div>
                <div className="space-y-1.5">
                  {([
                    { label: "KH", current: rawMaterialModulus.kh, plan: planModulus.kh, decimals: 3 },
                    { label: "SM", current: rawMaterialModulus.sm, plan: planModulus.sm, decimals: 2 },
                    { label: "IM", current: rawMaterialModulus.im, plan: planModulus.im, decimals: 2 },
                  ] as const).map((item) => {
                    const diff = item.current - item.plan;
                    return (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 w-16">{item.label}</span>
                        <span className="text-slate-300 w-14 text-right">{item.current.toFixed(item.decimals)}</span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-slate-300 w-14 text-right">{item.plan.toFixed(item.decimals)}</span>
                        <span className={`w-16 text-right font-medium rounded px-1 ${getDiffColor(diff)} ${getDiffBg(diff)}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(item.decimals)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/50 text-xs text-slate-500 flex items-center gap-4">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-normal inline-block" /> 一致/接近</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 小偏差</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-alarm inline-block" /> 大偏差</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="data-card">
        <h3 className="section-title">
          <TrendingUp className="w-5 h-5 text-industrial-400" />
          三率值 24 小时趋势
        </h3>
        <LineChart
          xAxisData={ratioTrendData.timestamps}
          series={[
            { name: "KH", data: ratioTrendData.kh, color: "#3B82F6" },
            { name: "SM", data: ratioTrendData.sm, color: "#10B981" },
            { name: "IM", data: ratioTrendData.im, color: "#F59E0B" },
          ]}
          height={320}
          showLegend={true}
        />
      </div>

      <div className="data-card">
        <h3 className="section-title">
          <History className="w-5 h-5 text-industrial-400" />
          历史配比数据
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>石灰石(%)</th>
                <th>粘土(%)</th>
                <th>铁粉(%)</th>
                <th>砂岩(%)</th>
                <th>煤灰(%)</th>
                <th>KH</th>
                <th>SM</th>
                <th>IM</th>
              </tr>
            </thead>
            <tbody>
              {historyData.rawMaterial.slice(-12).reverse().map((item) => (
                <tr key={item.id}>
                  <td className="text-slate-300">{new Date(item.timestamp).toLocaleString()}</td>
                  <td>{item.limestone.toFixed(1)}</td>
                  <td>{item.clay.toFixed(1)}</td>
                  <td>{item.ironPowder.toFixed(1)}</td>
                  <td>{item.sandstone.toFixed(1)}</td>
                  <td>{item.coalAsh.toFixed(1)}</td>
                  <td className="text-industrial-400 font-medium">{item.kh_value.toFixed(3)}</td>
                  <td className="text-industrial-400 font-medium">{item.sm_value.toFixed(2)}</td>
                  <td className="text-industrial-400 font-medium">{item.im_value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

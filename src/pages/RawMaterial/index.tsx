import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store";
import LineChart from "@/components/charts/LineChart";
import GaugeChart from "@/components/charts/GaugeChart";
import { PieChart, Target, TrendingUp, History, Mountain, Droplets, Cog, Layers, Flame as FlameIcon, Calculator, RotateCcw, Plus, Minus } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { calculateModulus, targetRanges } from "@/utils/formulaCalculator";

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

  const [adjustRatios, setAdjustRatios] = useState({
    limestone: rawMaterial.limestone,
    clay: rawMaterial.clay,
    ironPowder: rawMaterial.ironPowder,
    sandstone: rawMaterial.sandstone,
    coalAsh: rawMaterial.coalAsh,
  });

  const modulusResult = useMemo(() => calculateModulus(adjustRatios), [adjustRatios]);

  const handleRatioChange = (key: keyof typeof adjustRatios, value: number) => {
    setAdjustRatios((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, Number(value.toFixed(1)))),
    }));
  };

  const handleIncrement = (key: keyof typeof adjustRatios) => {
    handleRatioChange(key, adjustRatios[key] + 0.5);
  };

  const handleDecrement = (key: keyof typeof adjustRatios) => {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="pt-3 border-t border-slate-700">
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
        </div>
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

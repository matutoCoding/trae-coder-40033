import { create } from "zustand";
import { useEffect, useRef } from "react";
import type {
  ProductionStatus,
  RawMaterial,
  GrindingData,
  PreheaterData,
  KilnData,
  KilnShellPoint,
  CoolerData,
  QualityData,
  ProductionStat,
  Alarm,
  KPIData,
} from "../types";
import {
  generateProductionStatus,
  generateProductionStatusHistory,
  generateRawMaterial,
  generateRawMaterialHistory,
  generateGrindingData,
  generateGrindingDataHistory,
  generatePreheaterData,
  generatePreheaterDataHistory,
  generateKilnData,
  generateKilnDataHistory,
  generateKilnShellPoints,
  generateCoolerData,
  generateCoolerDataHistory,
  generateQualityData,
  generateQualityDataHistory,
  generateProductionStats,
  generateAlarms,
  generateKPIData,
} from "../data/mockData";

export type ModuleKey =
  | "overview"
  | "rawMaterial"
  | "grinding"
  | "preheater"
  | "kiln"
  | "cooler"
  | "quality"
  | "stats"
  | "alarms";

interface RealtimeData {
  productionStatus: ProductionStatus;
  rawMaterial: RawMaterial;
  grindingData: GrindingData;
  preheaterData: PreheaterData;
  kilnData: KilnData;
  kilnShellPoints: KilnShellPoint[];
  coolerData: CoolerData;
  qualityData: QualityData;
  kpiData: KPIData;
}

interface HistoryData {
  productionStatus: ProductionStatus[];
  rawMaterial: RawMaterial[];
  grindingData: GrindingData[];
  preheaterData: PreheaterData[];
  kilnData: KilnData[];
  coolerData: CoolerData[];
  qualityData: QualityData[];
}

interface AppState {
  currentModule: ModuleKey;
  setCurrentModule: (module: ModuleKey) => void;

  realtimeData: RealtimeData;
  refreshRealtimeData: () => void;

  historyData: HistoryData;
  refreshHistoryData: () => void;

  productionStats: ProductionStat[];
  refreshProductionStats: () => void;

  alarms: Alarm[];
  confirmAlarm: (alarmId: string, params: { handler: string; remark: string }) => void;
  resolveAlarm: (alarmId: string, params: { handler: string; remark: string }) => void;
  addAlarm: (alarm: Alarm) => void;
  refreshAlarms: () => void;
  persistAlarms: () => void;
  loadPersistedAlarms: () => Alarm[];

  isRefreshing: boolean;
  lastUpdateTime: string;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentModule: "overview",
  setCurrentModule: (module) => set({ currentModule: module }),

  realtimeData: {
    productionStatus: generateProductionStatus(),
    rawMaterial: generateRawMaterial(),
    grindingData: generateGrindingData(),
    preheaterData: generatePreheaterData(),
    kilnData: generateKilnData(),
    kilnShellPoints: generateKilnShellPoints(),
    coolerData: generateCoolerData(),
    qualityData: generateQualityData(),
    kpiData: generateKPIData(),
  },
  refreshRealtimeData: () =>
    set(() => ({
      realtimeData: {
        productionStatus: generateProductionStatus(),
        rawMaterial: generateRawMaterial(),
        grindingData: generateGrindingData(),
        preheaterData: generatePreheaterData(),
        kilnData: generateKilnData(),
        kilnShellPoints: generateKilnShellPoints(),
        coolerData: generateCoolerData(),
        qualityData: generateQualityData(),
        kpiData: generateKPIData(),
      },
      isRefreshing: false,
      lastUpdateTime: new Date().toISOString(),
    })),

  historyData: {
    productionStatus: generateProductionStatusHistory(),
    rawMaterial: generateRawMaterialHistory(),
    grindingData: generateGrindingDataHistory(),
    preheaterData: generatePreheaterDataHistory(),
    kilnData: generateKilnDataHistory(),
    coolerData: generateCoolerDataHistory(),
    qualityData: generateQualityDataHistory(),
  },
  refreshHistoryData: () =>
    set(() => ({
      historyData: {
        productionStatus: generateProductionStatusHistory(),
        rawMaterial: generateRawMaterialHistory(),
        grindingData: generateGrindingDataHistory(),
        preheaterData: generatePreheaterDataHistory(),
        kilnData: generateKilnDataHistory(),
        coolerData: generateCoolerDataHistory(),
        qualityData: generateQualityDataHistory(),
      },
    })),

  productionStats: generateProductionStats(),
  refreshProductionStats: () =>
    set(() => ({
      productionStats: generateProductionStats(),
    })),

  alarms: (() => {
    try {
      const persisted = localStorage.getItem('cement_alarm_records');
      if (persisted) {
        return JSON.parse(persisted) as Alarm[];
      }
    } catch {}
    return generateAlarms();
  })(),
  confirmAlarm: (alarmId, { handler, remark }) =>
    set((state) => {
      const now = new Date().toISOString();
      const alarms = state.alarms.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, status: "confirmed" as const, handler, confirmHandler: handler, confirmedAt: now, confirmRemark: remark }
          : alarm
      );
      try { localStorage.setItem('cement_alarm_records', JSON.stringify(alarms)); } catch {}
      return { alarms };
    }),
  resolveAlarm: (alarmId, { handler, remark }) =>
    set((state) => {
      const now = new Date().toISOString();
      const alarms = state.alarms.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, status: "resolved" as const, handler, resolveHandler: handler, resolvedAt: now, resolveRemark: remark }
          : alarm
      );
      try { localStorage.setItem('cement_alarm_records', JSON.stringify(alarms)); } catch {}
      return { alarms };
    }),
  addAlarm: (alarm) =>
    set((state) => {
      const alarms = [alarm, ...state.alarms];
      try { localStorage.setItem('cement_alarm_records', JSON.stringify(alarms)); } catch {}
      return { alarms };
    }),
  refreshAlarms: () =>
    set((state) => {
      const newAlarms = generateAlarms();
      const handledIds = new Set(
        state.alarms
          .filter((a) => a.status === "confirmed" || a.status === "resolved")
          .map((a) => a.id)
      );
      const preserved = state.alarms.filter((a) => handledIds.has(a.id));
      const newOnly = newAlarms.filter((a) => !handledIds.has(a.id));
      const alarms = [...preserved, ...newOnly];
      try { localStorage.setItem('cement_alarm_records', JSON.stringify(alarms)); } catch {}
      return { alarms };
    }),
  persistAlarms: () => {
    const alarms = get().alarms;
    try { localStorage.setItem('cement_alarm_records', JSON.stringify(alarms)); } catch {}
  },
  loadPersistedAlarms: () => {
    try {
      const persisted = localStorage.getItem('cement_alarm_records');
      if (persisted) {
        return JSON.parse(persisted) as Alarm[];
      }
    } catch {}
    return [];
  },

  isRefreshing: false,
  lastUpdateTime: new Date().toISOString(),
}));

export const useRealtimeRefresh = (enabled = true, interval = 1000) => {
  const { refreshRealtimeData } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      refreshRealtimeData();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, interval, refreshRealtimeData]);
};

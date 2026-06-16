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
  confirmAlarm: (alarmId: string, handler: string) => void;
  resolveAlarm: (alarmId: string, handler: string) => void;
  addAlarm: (alarm: Alarm) => void;
  refreshAlarms: () => void;

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

  alarms: generateAlarms(),
  confirmAlarm: (alarmId, handler) =>
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, status: "confirmed" as const, handler }
          : alarm
      ),
    })),
  resolveAlarm: (alarmId, handler) =>
    set((state) => ({
      alarms: state.alarms.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, status: "resolved" as const, handler }
          : alarm
      ),
    })),
  addAlarm: (alarm) =>
    set((state) => ({
      alarms: [alarm, ...state.alarms],
    })),
  refreshAlarms: () =>
    set(() => ({
      alarms: generateAlarms(),
    })),

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

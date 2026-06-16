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

const randomInRange = (min: number, max: number, decimals = 2): number => {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const generate24HourTimestamps = (): string[] => {
  const now = new Date();
  const timestamps: string[] = [];
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    timestamps.push(time.toISOString());
  }
  return timestamps;
};

export const generateProductionStatus = (timestamp?: string): ProductionStatus => {
  const ts = timestamp || new Date().toISOString();
  return {
    id: generateId(),
    timestamp: ts,
    kilnSpeed: randomInRange(3.0, 4.0, 2),
    kilnCurrent: randomInRange(500, 700, 0),
    feedRate: randomInRange(180, 220, 1),
    outputRate: randomInRange(100, 130, 1),
    status: Math.random() > 0.9 ? "warning" : "running",
  };
};

export const generateProductionStatusHistory = (): ProductionStatus[] => {
  return generate24HourTimestamps().map((ts) => generateProductionStatus(ts));
};

export const generateRawMaterial = (timestamp?: string): RawMaterial => {
  const ts = timestamp || new Date().toISOString();
  const limestone = randomInRange(75, 85, 1);
  const clay = randomInRange(8, 15, 1);
  const ironPowder = randomInRange(2, 5, 1);
  const sandstone = randomInRange(3, 8, 1);
  const coalAsh = randomInRange(1, 5, 1);
  return {
    id: generateId(),
    timestamp: ts,
    limestone,
    clay,
    ironPowder,
    sandstone,
    coalAsh,
    kh_value: randomInRange(0.88, 0.96, 3),
    sm_value: randomInRange(2.4, 2.8, 2),
    im_value: randomInRange(1.4, 1.8, 2),
  };
};

export const generateRawMaterialHistory = (): RawMaterial[] => {
  return generate24HourTimestamps().map((ts) => generateRawMaterial(ts));
};

export const generateGrindingData = (timestamp?: string): GrindingData => {
  const ts = timestamp || new Date().toISOString();
  return {
    id: generateId(),
    timestamp: ts,
    sieveResidue_008: randomInRange(8, 14, 1),
    sieveResidue_002: randomInRange(0.5, 2.0, 2),
    specificSurface: randomInRange(320, 380, 0),
    millCurrent: randomInRange(150, 220, 0),
    feedRate: randomInRange(80, 120, 1),
  };
};

export const generateGrindingDataHistory = (): GrindingData[] => {
  return generate24HourTimestamps().map((ts) => generateGrindingData(ts));
};

export const generatePreheaterData = (timestamp?: string): PreheaterData => {
  const ts = timestamp || new Date().toISOString();
  return {
    id: generateId(),
    timestamp: ts,
    c1_temp: randomInRange(300, 350, 0),
    c1_pressure: randomInRange(-5.5, -4.0, 2),
    c2_temp: randomInRange(430, 480, 0),
    c2_pressure: randomInRange(-5.0, -3.5, 2),
    c3_temp: randomInRange(600, 660, 0),
    c3_pressure: randomInRange(-4.5, -3.0, 2),
    c4_temp: randomInRange(740, 800, 0),
    c4_pressure: randomInRange(-4.0, -2.5, 2),
    c5_temp: randomInRange(840, 900, 0),
    c5_pressure: randomInRange(-3.5, -2.0, 2),
    calcinerTemp: randomInRange(870, 920, 0),
    calcinerCoalRate: randomInRange(6.5, 9.0, 2),
    airCoalRatio: randomInRange(8.5, 10.5, 2),
  };
};

export const generatePreheaterDataHistory = (): PreheaterData[] => {
  return generate24HourTimestamps().map((ts) => generatePreheaterData(ts));
};

export const generateKilnData = (timestamp?: string): KilnData => {
  const ts = timestamp || new Date().toISOString();
  return {
    id: generateId(),
    timestamp: ts,
    kilnSpeed: randomInRange(3.0, 4.0, 2),
    kilnCurrent: randomInRange(500, 700, 0),
    kilnPower: randomInRange(2500, 3500, 0),
    kilnHeadCoalRate: randomInRange(4.5, 7.0, 2),
    flameTemp: randomInRange(1600, 1800, 0),
    primaryAirPressure: randomInRange(35, 55, 1),
    kilnInletTemp: randomInRange(1000, 1150, 0),
    kilnOutletTemp: randomInRange(180, 280, 0),
  };
};

export const generateKilnDataHistory = (): KilnData[] => {
  return generate24HourTimestamps().map((ts) => generateKilnData(ts));
};

export const generateKilnShellPoints = (): KilnShellPoint[] => {
  const points: KilnShellPoint[] = [];
  for (let i = 1; i <= 30; i++) {
    const position = (i / 30) * 100;
    let baseTemp: number;
    let baseThickness: number;

    if (position <= 20) {
      baseTemp = randomInRange(280, 350, 0);
      baseThickness = randomInRange(180, 220, 0);
    } else if (position <= 60) {
      baseTemp = randomInRange(320, 420, 0);
      baseThickness = randomInRange(150, 200, 0);
    } else if (position <= 85) {
      baseTemp = randomInRange(250, 350, 0);
      baseThickness = randomInRange(180, 230, 0);
    } else {
      baseTemp = randomInRange(200, 280, 0);
      baseThickness = randomInRange(200, 250, 0);
    }

    points.push({
      position: Number(position.toFixed(1)),
      temperature: baseTemp,
      brickThickness: baseThickness,
    });
  }
  return points;
};

export const generateCoolerData = (timestamp?: string): CoolerData => {
  const ts = timestamp || new Date().toISOString();
  return {
    id: generateId(),
    timestamp: ts,
    grateSpeed: randomInRange(12, 20, 1),
    chamber1AirFlow: randomInRange(18, 25, 1),
    chamber1Pressure: randomInRange(4.5, 6.5, 2),
    chamber2AirFlow: randomInRange(15, 22, 1),
    chamber2Pressure: randomInRange(3.5, 5.5, 2),
    chamber3AirFlow: randomInRange(10, 18, 1),
    chamber3Pressure: randomInRange(2.5, 4.5, 2),
    bedThickness: randomInRange(500, 800, 0),
    clinkerOutletTemp: randomInRange(65, 110, 0),
    coolingEfficiency: randomInRange(70, 85, 1),
  };
};

export const generateCoolerDataHistory = (): CoolerData[] => {
  return generate24HourTimestamps().map((ts) => generateCoolerData(ts));
};

export const generateQualityData = (timestamp?: string): QualityData => {
  const ts = timestamp || new Date().toISOString();
  return {
    id: generateId(),
    timestamp: ts,
    sampleNo: `S${Date.now().toString().slice(-6)}`,
    fCao: randomInRange(1.0, 2.0, 2),
    literWeight: randomInRange(1100, 1350, 0),
    strength_3d: randomInRange(28, 35, 1),
    strength_28d: randomInRange(52, 62, 1),
    inspector: ["张工", "李工", "王工", "赵工"][Math.floor(Math.random() * 4)],
  };
};

export const generateQualityDataHistory = (): QualityData[] => {
  return generate24HourTimestamps().map((ts) => generateQualityData(ts));
};

export const generateProductionStats = (): ProductionStat[] => {
  const stats: ProductionStat[] = [];
  const shifts = ["早班", "中班", "晚班"];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];

    shifts.forEach((shift) => {
      stats.push({
        date: dateStr,
        shift,
        hourlyOutput: randomInRange(90, 130, 1),
        dailyOutput: randomInRange(2200, 2800, 0),
        monthlyOutput: randomInRange(65000, 78000, 0),
        standardCoalConsumption: randomInRange(105, 120, 1),
        powerConsumption: randomInRange(55, 75, 1),
      });
    });
  }

  return stats;
};

const alarmParameters = [
  { param: "C5温度", min: 900, max: 950, threshold: 900 },
  { param: "分解炉温度", min: 920, max: 960, threshold: 920 },
  { param: "游离钙fCao", min: 2.1, max: 2.8, threshold: 2.0 },
  { param: "窑主电机电流", min: 710, max: 780, threshold: 700 },
  { param: "篦冷机出料温度", min: 115, max: 150, threshold: 110 },
  { param: "窑筒体温度", min: 430, max: 480, threshold: 420 },
];

export const generateAlarms = (): Alarm[] => {
  const alarms: Alarm[] = [];
  const count = Math.floor(Math.random() * 4) + 3;
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const alarmInfo = alarmParameters[Math.floor(Math.random() * alarmParameters.length)];
    const level: "info" | "warning" | "alarm" = Math.random() > 0.7
      ? "alarm"
      : Math.random() > 0.4
        ? "warning"
        : "info";
    const status: "pending" | "confirmed" | "resolved" = Math.random() > 0.6
      ? "pending"
      : Math.random() > 0.3
        ? "confirmed"
        : "resolved";

    const ts = new Date(now.getTime() - i * 30 * 60 * 1000);

    alarms.push({
      id: generateId(),
      timestamp: ts.toISOString(),
      parameter: alarmInfo.param,
      value: randomInRange(alarmInfo.min, alarmInfo.max, 2),
      threshold: alarmInfo.threshold,
      level,
      status,
      handler: status === "resolved" ? ["张工", "李工", "王工"][Math.floor(Math.random() * 3)] : undefined,
    });
  }

  return alarms;
};

export const generateKPIData = (): KPIData => {
  return {
    hourlyOutput: randomInRange(100, 130, 1),
    dailyOutput: randomInRange(2300, 2800, 0),
    fCao: randomInRange(1.0, 2.0, 2),
    literWeight: randomInRange(1100, 1350, 0),
    kilnSpeed: randomInRange(3.0, 4.0, 2),
    kilnCurrent: randomInRange(500, 700, 0),
    clinkerTemp: randomInRange(65, 110, 0),
    coolingEfficiency: randomInRange(70, 85, 1),
    fCaoPassRate: randomInRange(88, 98, 1),
    literWeightPassRate: randomInRange(85, 96, 1),
  };
};

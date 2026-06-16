export interface ProductionStatus {
  id: string;
  timestamp: string;
  kilnSpeed: number;
  kilnCurrent: number;
  feedRate: number;
  outputRate: number;
  status: "running" | "stopped" | "warning";
}

export interface RawMaterial {
  id: string;
  timestamp: string;
  limestone: number;
  clay: number;
  ironPowder: number;
  sandstone: number;
  coalAsh: number;
  kh_value: number;
  sm_value: number;
  im_value: number;
}

export interface GrindingData {
  id: string;
  timestamp: string;
  sieveResidue_008: number;
  sieveResidue_002: number;
  specificSurface: number;
  millCurrent: number;
  feedRate: number;
}

export interface PreheaterData {
  id: string;
  timestamp: string;
  c1_temp: number;
  c1_pressure: number;
  c2_temp: number;
  c2_pressure: number;
  c3_temp: number;
  c3_pressure: number;
  c4_temp: number;
  c4_pressure: number;
  c5_temp: number;
  c5_pressure: number;
  calcinerTemp: number;
  calcinerCoalRate: number;
  airCoalRatio: number;
}

export interface KilnData {
  id: string;
  timestamp: string;
  kilnSpeed: number;
  kilnCurrent: number;
  kilnPower: number;
  kilnHeadCoalRate: number;
  flameTemp: number;
  primaryAirPressure: number;
  kilnInletTemp: number;
  kilnOutletTemp: number;
}

export interface KilnShellPoint {
  position: number;
  temperature: number;
  brickThickness: number;
}

export interface CoolerData {
  id: string;
  timestamp: string;
  grateSpeed: number;
  chamber1AirFlow: number;
  chamber1Pressure: number;
  chamber2AirFlow: number;
  chamber2Pressure: number;
  chamber3AirFlow: number;
  chamber3Pressure: number;
  bedThickness: number;
  clinkerOutletTemp: number;
  coolingEfficiency: number;
}

export interface QualityData {
  id: string;
  timestamp: string;
  sampleNo: string;
  fCao: number;
  literWeight: number;
  strength_3d: number;
  strength_28d: number;
  inspector: string;
}

export interface ProductionStat {
  date: string;
  shift: string;
  hourlyOutput: number;
  dailyOutput: number;
  monthlyOutput: number;
  standardCoalConsumption: number;
  powerConsumption: number;
}

export interface Alarm {
  id: string;
  timestamp: string;
  parameter: string;
  value: number;
  threshold: number;
  level: "info" | "warning" | "alarm";
  status: "pending" | "confirmed" | "resolved";
  handler?: string;
  confirmHandler?: string;
  resolveHandler?: string;
  confirmedAt?: string;
  resolvedAt?: string;
  confirmRemark?: string;
  resolveRemark?: string;
}

export interface KPIData {
  hourlyOutput: number;
  dailyOutput: number;
  fCao: number;
  literWeight: number;
  kilnSpeed: number;
  kilnCurrent: number;
  clinkerTemp: number;
  coolingEfficiency: number;
  fCaoPassRate: number;
  literWeightPassRate: number;
}

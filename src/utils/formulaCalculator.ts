export interface RawMaterialComposition {
  sio2: number;
  al2o3: number;
  fe2o3: number;
  cao: number;
  loss: number;
}

export const rawMaterialCompositions: Record<string, RawMaterialComposition> = {
  limestone: {
    sio2: 2.5,
    al2o3: 0.8,
    fe2o3: 0.5,
    cao: 52.0,
    loss: 43.0,
  },
  clay: {
    sio2: 65.0,
    al2o3: 15.0,
    fe2o3: 5.5,
    cao: 2.0,
    loss: 8.0,
  },
  ironPowder: {
    sio2: 25.0,
    al2o3: 8.0,
    fe2o3: 48.0,
    cao: 5.0,
    loss: 3.0,
  },
  sandstone: {
    sio2: 90.0,
    al2o3: 3.0,
    fe2o3: 1.5,
    cao: 1.0,
    loss: 2.0,
  },
  coalAsh: {
    sio2: 55.0,
    al2o3: 28.0,
    fe2o3: 6.5,
    cao: 3.0,
    loss: 2.0,
  },
};

export interface RatioInput {
  limestone: number;
  clay: number;
  ironPowder: number;
  sandstone: number;
  coalAsh: number;
}

export interface ModulusResult {
  kh: number;
  sm: number;
  im: number;
  total: number;
  isValid: boolean;
  khStatus: "normal" | "warning" | "alarm";
  smStatus: "normal" | "warning" | "alarm";
  imStatus: "normal" | "warning" | "alarm";
}

export const targetRanges = {
  kh: { lower: 0.88, upper: 0.94, warnLow: 0.86, warnHigh: 0.96 },
  sm: { lower: 2.4, upper: 2.7, warnLow: 2.2, warnHigh: 2.9 },
  im: { lower: 1.4, upper: 1.7, warnLow: 1.2, warnHigh: 1.9 },
};

export const calculateModulus = (ratios: RatioInput): ModulusResult => {
  const total =
    ratios.limestone +
    ratios.clay +
    ratios.ironPowder +
    ratios.sandstone +
    ratios.coalAsh;

  const isValid = Math.abs(total - 100) < 0.5;

  let totalSio2 = 0;
  let totalAl2o3 = 0;
  let totalFe2o3 = 0;
  let totalCao = 0;

  const materials: [string, number][] = [
    ["limestone", ratios.limestone],
    ["clay", ratios.clay],
    ["ironPowder", ratios.ironPowder],
    ["sandstone", ratios.sandstone],
    ["coalAsh", ratios.coalAsh],
  ];

  materials.forEach(([key, ratio]) => {
    const comp = rawMaterialCompositions[key];
    const factor = ratio / 100;
    totalSio2 += comp.sio2 * factor;
    totalAl2o3 += comp.al2o3 * factor;
    totalFe2o3 += comp.fe2o3 * factor;
    totalCao += comp.cao * factor;
  });

  const kh = totalAl2o3 + totalFe2o3 > 0
    ? (totalCao - 1.65 * totalAl2o3 - 0.35 * totalFe2o3) / (2.8 * totalSio2)
    : 0;

  const sm = totalAl2o3 + totalFe2o3 > 0
    ? totalSio2 / (totalAl2o3 + totalFe2o3)
    : 0;

  const im = totalFe2o3 > 0
    ? totalAl2o3 / totalFe2o3
    : 0;

  const getStatus = (value: number, range: typeof targetRanges.kh): "normal" | "warning" | "alarm" => {
    if (value >= range.lower && value <= range.upper) return "normal";
    if (value >= range.warnLow && value <= range.warnHigh) return "warning";
    return "alarm";
  };

  return {
    kh: Number(kh.toFixed(3)),
    sm: Number(sm.toFixed(2)),
    im: Number(im.toFixed(2)),
    total: Number(total.toFixed(1)),
    isValid,
    khStatus: getStatus(kh, targetRanges.kh),
    smStatus: getStatus(sm, targetRanges.sm),
    imStatus: getStatus(im, targetRanges.im),
  };
};

export const formatRatio = (value: number, decimals = 1): string => {
  return value.toFixed(decimals);
};

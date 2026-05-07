import type { EVModel } from './types.js';

// Rough Ontario mixed-driving consumption for modern EVs.
// v1.5 should make this a per-model number.
const KWH_PER_KM = 0.18;

export type ChargeEstimate = {
  minutes: number;
  energyAddedKwh: number;
  rangeAddedKm: number;
  effectiveKw: number;
  startSocPct: number;
  targetSocPct: number;
  cappedAt80: boolean;
  notes: string[];
};

export type ChargeEstimateInput = {
  ev: EVModel;
  startSocPct: number;
  targetSocPct: number;
  chargerMaxKw: number;
};

// v1 estimate: linear scaling off the vehicle's published 10→80% time.
// Ignores the charge-curve taper above 80% by clamping the target.
// Below ~10% SoC the rate is also lower in reality; we don't model that yet.
export function estimateChargeTime({
  ev,
  startSocPct,
  targetSocPct,
  chargerMaxKw,
}: ChargeEstimateInput): ChargeEstimate {
  if (startSocPct < 0 || startSocPct > 100) throw new Error('startSocPct must be in [0, 100]');
  if (targetSocPct < 0 || targetSocPct > 100) throw new Error('targetSocPct must be in [0, 100]');
  if (targetSocPct <= startSocPct) throw new Error('targetSocPct must exceed startSocPct');
  if (chargerMaxKw <= 0) throw new Error('chargerMaxKw must be positive');

  const notes: string[] = [];
  let cappedAt80 = false;
  let target = targetSocPct;
  if (target > 80) {
    notes.push(
      'Target capped at 80% for this estimate; charging above 80% tapers significantly and is not modelled in v1.',
    );
    cappedAt80 = true;
    target = 80;
  }

  const effectiveKw = Math.min(ev.maxDcfcKw, chargerMaxKw);
  if (chargerMaxKw < ev.maxDcfcKw) {
    notes.push(
      `Charger limited at ${chargerMaxKw} kW; vehicle accepts up to ${ev.maxDcfcKw} kW.`,
    );
  }

  const refMinutesPerPct = ev.charge10To80Min / 70;
  const rateFactor = effectiveKw / ev.maxDcfcKw;
  const minutesPerPct = refMinutesPerPct / rateFactor;

  const minutes = (target - startSocPct) * minutesPerPct;
  const energyAddedKwh = ((target - startSocPct) / 100) * ev.batteryKwhUsable;
  const rangeAddedKm = energyAddedKwh / KWH_PER_KM;

  return {
    minutes,
    energyAddedKwh,
    rangeAddedKm,
    effectiveKw,
    startSocPct,
    targetSocPct: target,
    cappedAt80,
    notes,
  };
}

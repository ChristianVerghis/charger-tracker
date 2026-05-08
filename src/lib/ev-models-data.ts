// Browser-safe copy of the v1 EV-model seed. Mirrors `data/ev_models.csv`.
// Updates to the CSV must be reflected here too — kept manually in sync until
// we wire the page to the Supabase `ev_models` table.

import type { Connector, EVModel } from '@/ev/types';

export type { EVModel };

function slug(...parts: Array<string | number | undefined>): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ev(
  make: string,
  model: string,
  year: number,
  trim: string | undefined,
  batteryKwhUsable: number,
  maxDcfcKw: number,
  connector: Connector,
  charge10To80Min: number,
  notes?: string,
): EVModel {
  return {
    id: slug(make, model, year, trim),
    make,
    model,
    year,
    trim,
    batteryKwhUsable,
    maxDcfcKw,
    connector,
    charge10To80Min,
    notes,
  };
}

export const EV_MODELS: EVModel[] = [
  ev('Tesla', 'Model Y', 2024, 'Long Range AWD', 75, 250, 'J3400', 28, 'V3 Supercharger; CCS1 via adapter'),
  ev('Tesla', 'Model 3', 2024, 'Long Range', 75, 250, 'J3400', 28, 'V3 Supercharger; CCS1 via adapter'),
  ev('Tesla', 'Model Y', 2025, 'Standard Range', 60, 175, 'J3400', 28, 'LFP pack'),
  ev('Hyundai', 'Ioniq 5', 2024, 'Preferred LR AWD', 77.4, 235, 'CCS1', 18, '800V architecture'),
  ev('Hyundai', 'Ioniq 6', 2024, 'Preferred LR AWD', 77.4, 235, 'CCS1', 18, '800V architecture'),
  ev('Kia', 'EV6', 2024, 'GT-Line AWD', 77.4, 235, 'CCS1', 18, '800V architecture'),
  ev('Kia', 'EV9', 2024, 'Land', 99.8, 235, 'CCS1', 24, '3-row 800V SUV'),
  ev('Genesis', 'GV60', 2024, 'Performance AWD', 77.4, 235, 'CCS1', 18, '800V architecture'),
  ev('Ford', 'Mustang Mach-E', 2024, 'Premium ER AWD', 91, 150, 'CCS1', 38),
  ev('Ford', 'F-150 Lightning', 2024, 'XLT ER', 131, 150, 'CCS1', 41),
  ev('Chevrolet', 'Equinox EV', 2024, '2LT', 85, 150, 'CCS1', 40, 'Ultium'),
  ev('Chevrolet', 'Blazer EV', 2024, '2LT AWD', 85, 190, 'CCS1', 40, 'Ultium'),
  ev('Cadillac', 'Lyriq', 2024, 'Luxury AWD', 102, 190, 'CCS1', 35, 'Ultium'),
  ev('Honda', 'Prologue', 2024, 'Touring AWD', 85, 155, 'CCS1', 35, 'GM Ultium platform'),
  ev('Acura', 'ZDX', 2024, 'A-Spec AWD', 102, 190, 'CCS1', 42, 'GM Ultium platform'),
  ev('Volkswagen', 'ID.4', 2024, 'Pro S AWD', 82, 175, 'CCS1', 28),
  ev('Audi', 'Q4 e-tron', 2024, '55 quattro', 82, 175, 'CCS1', 28, 'VW MEB platform'),
  ev('BMW', 'i4', 2024, 'M50 xDrive', 81, 200, 'CCS1', 31),
  ev('BMW', 'iX', 2024, 'xDrive50', 105, 195, 'CCS1', 35),
  ev('Polestar', 'Polestar 2', 2024, 'LR Dual Motor', 78, 155, 'CCS1', 28),
  ev('Volvo', 'XC40 Recharge', 2024, 'Twin AWD', 78, 150, 'CCS1', 28, 'renamed EX40 in some markets'),
  ev('Mercedes-Benz', 'EQE Sedan', 2024, '350 4MATIC', 90, 170, 'CCS1', 32),
  ev('Mercedes-Benz', 'EQS Sedan', 2024, '450 4MATIC', 108, 200, 'CCS1', 31),
  ev('Rivian', 'R1T', 2024, 'Dual Large', 135, 220, 'CCS1', 33, 'J3400 native from 2025'),
  ev('Rivian', 'R1S', 2024, 'Dual Large', 135, 220, 'CCS1', 33, 'J3400 native from 2025'),
  ev('Lucid', 'Air', 2024, 'Touring', 118, 300, 'CCS1', 22, '924V architecture'),
  ev('Nissan', 'Ariya', 2024, 'Engage+ AWD', 87, 130, 'CCS1', 35),
  ev('Nissan', 'LEAF', 2024, 'SV Plus', 60, 100, 'CHADEMO', 45, 'last mainstream CHAdeMO seller'),
  ev('Toyota', 'bZ4X', 2024, 'XLE AWD', 71.4, 150, 'CCS1', 30, 'shared platform with Solterra'),
  ev('Subaru', 'Solterra', 2024, 'Limited AWD', 71.4, 100, 'CCS1', 35, 'shared platform with bZ4X'),
  ev('Tesla', 'Cybertruck', 2024, 'Dual Motor AWD', 123, 250, 'J3400', 38, 'heavier vehicle; longer 10-80% than other Teslas'),
  ev('Tesla', 'Model X', 2024, 'Long Range', 100, 250, 'J3400', 30, 'V3 Supercharger; CCS1 via adapter'),
  ev('Tesla', 'Model S', 2024, 'Long Range', 100, 250, 'J3400', 30, 'V3 Supercharger; CCS1 via adapter'),
  ev('Hyundai', 'Kona Electric', 2024, 'Preferred', 64, 100, 'CCS1', 47, 'older platform than Ioniq line; 400V architecture'),
  ev('BMW', 'i5', 2024, 'eDrive40', 81, 205, 'CCS1', 30),
  ev('Porsche', 'Taycan', 2024, '4S', 89, 270, 'CCS1', 22, '800V architecture'),
  ev('Lexus', 'RZ', 2024, '450e', 64, 150, 'CCS1', 30, 'Toyota e-TNGA platform'),
  ev('GMC', 'Hummer EV', 2024, 'Pickup 2X', 205, 350, 'CCS1', 40, 'heavy 9000+ lb truck; large pack'),
  ev('Chevrolet', 'Silverado EV', 2024, 'RST', 200, 350, 'CCS1', 40, 'Ultium platform; large pack'),
  ev('Genesis', 'Electrified GV70', 2024, 'Prestige', 77.4, 235, 'CCS1', 18, '800V architecture'),
  ev('Mercedes-Benz', 'EQB', 2024, '350 4MATIC', 66.5, 100, 'CCS1', 32),
  ev('Mini', 'Cooper SE', 2024, 'Electric', 28.9, 50, 'CCS1', 36, 'small battery; modest DCFC speed'),
];

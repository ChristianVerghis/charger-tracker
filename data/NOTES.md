# EV models seed — notes

## What this is

`ev_models.csv` is the v1 seed of EV-specific data for the charger insight feature. ~30 models, chosen to cover the long tail of EVs realistically driven in Hamilton/GTA. Used to compute "how long to add 100 km from X% SoC at this charger" given the user's selected vehicle.

## Columns

- **make / model / year / trim** — identifying the variant
- **battery_kwh_usable** — usable (not gross) pack capacity. The number that matters for range and session math.
- **max_dcfc_kw** — peak DCFC rate the vehicle accepts. Real-world average will be lower; charge curves taper.
- **connector** — primary inlet: `CCS1`, `J3400` (NACS), or `CHAdeMO`. Adapter compatibility handled in app logic, not the CSV.
- **charge_10_to_80_min** — manufacturer-claimed or test-derived 10→80% time at peak conditions. The reference number for v1 calculations.
- **notes** — anything caller code shouldn't have to guess at.

## Caveats

- **Numbers are approximate.** Sourced from a mix of manufacturer claims, InsideEVs charge tests, and Bjørn Nyland's testing series. Verify each row against current manufacturer specs before public launch.
- **2025+ J3400 transitions are messy.** Several non-Tesla brands ship native NACS in 2025 model year (Ford, GM, Rivian, Hyundai/Kia/Genesis). The CSV reflects 2024 model years to keep the connector column clean; expand for 2025+ in v1.5.
- **Charge curves are not linear.** v1 will treat 10→80% time as a flat estimate. v1.5 should add waypoint data (e.g., kW at 10/30/50/70%) for a real curve.
- **Trim variants matter.** Battery size and peak rate vary by trim. The CSV picks a representative trim per model; users can adjust their assumptions in v1.5 trim selector.

## Update cadence

Reverify against manufacturer specs at the start of each model year (Sept/Oct). When adding a row, prefer real test data over manufacturer claims when the two disagree.

# Historical Scenarios Template

## Purpose
Use `historical_scenarios_template.csv` to add new historical scenarios consistently.

## Required Columns
- `scenarioId` (unique key)
- `period` (e.g. 2020-Q1)
- `year` (integer, used for asset availability)
- `description`
- `verifiedAt` (YYYY-MM-DD)
- `dataSource` (FRED/Yahoo/Manual/etc.)

## Macro Columns (required for predictive model)
- `fedRate, inflation, usd, realYield, vix, creditSpread, globalGrowth, cnPolicy, momentum`

## Return Columns (per asset key)
- `cnStock, usStock, devStock, emStock`
- `bonds_us, bonds_china, bonds_global`
- `precious, energy, industrial, agriculture`
- `crypto`
- `forex_major, forex_safe, forex_cny, forex_commodity`
- `hedges`

Missing returns can be left blank. They will be treated as `null`.

## Import Script
Run:
- `node scripts/import_scenarios_from_csv.js <csv_path>`

The script will generate a JSON file you can import via:
- `window.loadCustomHistoricalSnapshots(customObj)`
- or by storing into `localStorage.historicalSnapshots_custom`

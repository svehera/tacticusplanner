/* eslint-disable import-x/no-internal-modules */
import items from './data/character-power-items.json';
import units from './data/character-power-units.json';
import upgrades from './data/character-power-upgrades.json';

/**
 * The trimmed slice of Snowprint's `clientGameConfig` the power formula needs, bundled at build
 * time (see `scripts`/README of the sibling `tacops` repo for how it is re-extracted each patch).
 * `units` is `clientGameConfig.units` picked down to the power-relevant keys; `items` and
 * `upgrades` are `clientGameConfig.items` / `.upgrades` verbatim.
 */
export interface PowerConfig {
    units: unknown;
    items: unknown;
    upgrades: unknown;
}

export const bundledPowerConfig: PowerConfig = { units, items, upgrades };

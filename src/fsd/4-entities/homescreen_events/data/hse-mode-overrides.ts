import type { HseFlatMode, HseFlatModeConfig, HseWaveBasedMode, HseWaveModeConfig } from '../homescreen-event.model';

/**
 * Per-event overrides for mode enablement, consulted per-mode before falling through to
 * auto-derivation from tracker `gameModeRestrictions` (see `getHseModesConfig`). Populate this
 * only when the tracker data doesn't reflect reality for a specific event/mode.
 */
export const hseModeOverrides: Record<
    string,
    Partial<Record<HseWaveBasedMode, HseWaveModeConfig> & Record<HseFlatMode, HseFlatModeConfig>>
> = {};

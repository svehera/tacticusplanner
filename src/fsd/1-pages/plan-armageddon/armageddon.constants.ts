import { RarityStars } from '@/fsd/5-shared/model';

export const MYTHIC_UNCRAFTABLE_UPGRADES = [
    {
        id: 'upgHpM001',
        material: 'Imperial Aquila',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM001.png',
    },
    {
        id: 'upgHpM002',
        material: 'Mutant Form',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM002.png',
    },
    {
        id: 'upgHpM003',
        material: 'Ancient Inscription',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM003.png',
    },
    {
        id: 'upgHpM004',
        material: 'Venerable Battle Mark',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM004.png',
    },
] as const;

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
};

// Event start date: June 22, 2026 (Monday of week 1)
export const EVENT_START_UTC = Date.UTC(2026, 5, 22); // months are 0-indexed

// Computed once at module load (acceptable: changes at most once per day).
const _TODAY_OFFSET_DAYS = (() => {
    const now = new Date();
    const utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((utcMs - EVENT_START_UTC) / 86_400_000);
})();

// 0–20 if currently in the event, -1 otherwise.
export const TODAY_EVENT_INDEX = _TODAY_OFFSET_DAYS >= 0 && _TODAY_OFFSET_DAYS < 21 ? _TODAY_OFFSET_DAYS : -1;
// Default index for the Daily Purchases dropdown:
//   before event → first day (0), during event → today, after event → last day (20).
export const TODAY_DEFAULT_INDEX = TODAY_EVENT_INDEX >= 0 ? TODAY_EVENT_INDEX : _TODAY_OFFSET_DAYS < 0 ? 0 : 20;

// All 21 event day slots, indexed 0–20.
export const ALL_EVENT_DATES = Array.from({ length: 21 }, (_, index) => ({
    week: (Math.floor(index / 7) + 1) as 1 | 2 | 3,
    day: DAYS[index % 7],
}));

export const PL_HIGH = 25;
export const PL_MEDIUM = 15;
// < PL_MEDIUM → low

// "Max legendary" = first blue star or higher (includes mythic)
export const MAX_LEGENDARY_THRESHOLD = RarityStars.OneBlueStar;

export const ICON_SIZE = 45;

import { factionLookup } from '@/fsd/5-shared/lib';
import { Alliance, FactionId } from '@/fsd/5-shared/model';

export interface FactionGroup {
    alliance: Alliance;
    factions: FactionId[];
}

const ALLIANCE_ORDER: Alliance[] = [Alliance.Imperial, Alliance.Xenos, Alliance.Chaos];

/** @returns the factions grouped by alliance, each group sorted alphabetically by display name. */
export function groupFactionsByAlliance(factions: FactionId[]): FactionGroup[] {
    return ALLIANCE_ORDER.map(alliance => ({
        alliance,
        factions: factions
            .filter(faction => factionLookup[faction].alliance === alliance)
            .toSorted((a, b) => factionLookup[a].name.localeCompare(factionLookup[b].name)),
    })).filter(group => group.factions.length > 0);
}

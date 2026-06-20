/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';

import { ParsedUnit, RAID_COMP_MEMBERS, RaidComp } from './guild-roster-snapshots.models';

export interface UnitCategories {
    coreIds: Set<string>;
    flexIds: Set<string>;
    mowIds: Set<string>;
}

function emptyCategories(): UnitCategories {
    return { coreIds: new Set(), flexIds: new Set(), mowIds: new Set() };
}

export function standardCompCategories(comps: RaidComp[]): UnitCategories {
    const result = emptyCategories();
    for (const comp of comps) {
        const members = RAID_COMP_MEMBERS[comp];
        for (const id of members.coreIds) result.coreIds.add(id);
        for (const id of members.flexIds) result.flexIds.add(id);
        for (const id of members.mowIds) result.mowIds.add(id);
    }
    return result;
}

export function customTeamCategories(teams: ITeam2[], names: string[]): UnitCategories {
    const result = emptyCategories();
    const nameSet = new Set(names);
    for (const team of teams) {
        if (!nameSet.has(team.name)) continue;
        const coreChars = team.flexIndex === undefined ? team.chars : team.chars.slice(0, team.flexIndex);
        const flexChars = team.flexIndex === undefined ? [] : team.chars.slice(team.flexIndex);
        for (const id of coreChars) result.coreIds.add(id);
        for (const id of flexChars) result.flexIds.add(id);
        for (const id of team.mows ?? []) result.mowIds.add(id);
    }
    return result;
}

export function mergedCategories(a: UnitCategories, b: UnitCategories): UnitCategories {
    return {
        coreIds: new Set([...a.coreIds, ...b.coreIds]),
        flexIds: new Set([...a.flexIds, ...b.flexIds]),
        mowIds: new Set([...a.mowIds, ...b.mowIds]),
    };
}

function parsedUnitId(unit: ParsedUnit): string | undefined {
    return unit.char?.id ?? unit.mow?.id;
}

function categorySortKey(unit: ParsedUnit, cats: UnitCategories): number {
    const id = parsedUnitId(unit);
    if (!id) return 3;
    if (cats.coreIds.has(id)) return 0;
    if (cats.flexIds.has(id)) return 1;
    if (cats.mowIds.has(id)) return 2;
    return 3;
}

export function filterAndSortUnits(units: ParsedUnit[], cats: UnitCategories): ParsedUnit[] {
    const allIds = new Set([...cats.coreIds, ...cats.flexIds, ...cats.mowIds]);
    const visible = units.filter(u => {
        const id = parsedUnitId(u);
        return id !== undefined && allIds.has(id);
    });
    return visible.toSorted((a, b) => {
        const keyDiff = categorySortKey(a, cats) - categorySortKey(b, cats);
        return keyDiff === 0 ? b.power - a.power : keyDiff;
    });
}

import { ITeam2 } from './models';

/** Returns the set of snowprintIds for all chars and mows belonging to the named teams. */
export function getUnitIdsFromTeamNames(teams: ITeam2[], teamNames: string[]): Set<string> {
    if (teamNames.length === 0) return new Set();
    const nameSet = new Set(teamNames);
    return new Set(teams.filter(t => nameSet.has(t.name)).flatMap(t => [...t.chars, ...(t.mows ?? [])]));
}

import { ICharacter2 } from '@/fsd/4-entities/character';

import { ILreTeam } from '@/fsd/3-features/lre';

import { ITableRow } from './lre.models';

export interface ISelectedTeamTableCell {
    character: ICharacter2;
    teamId: string;
}

export function buildSelectedTeamsRows(
    teams: ILreTeam[],
    charactersBySnowprintId: Record<string, ICharacter2>
): Array<ITableRow<ISelectedTeamTableCell | string>> {
    const teamRecord: Record<string, ISelectedTeamTableCell[]> = {};

    for (const team of teams) {
        const newTeam = (team.charSnowprintIds ?? [])
            .slice(0, 5)
            .map(charId => charactersBySnowprintId[charId])
            .filter((character): character is ICharacter2 => !!character)
            .map(character => ({
                character,
                teamId: team.id,
            }));

        for (const id of team.restrictionsIds) {
            const existingCharacters = teamRecord[id] ?? [];
            teamRecord[id] = [...existingCharacters, ...newTeam];
        }
    }

    const size = Math.max(0, ...Object.values(teamRecord).map(x => x.length));
    const rows: Array<ITableRow<ISelectedTeamTableCell | string>> = Array.from({ length: size }, () => ({}));

    for (const [index, row] of rows.entries()) {
        for (const team in teamRecord) {
            row[team] = teamRecord[team][index] ?? '';
        }
    }

    return rows;
}

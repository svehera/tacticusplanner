/* eslint-disable unicorn/prevent-abbreviations */
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
    const teamRecord: Record<string, Array<ISelectedTeamTableCell | undefined>> = {};

    for (const team of teams) {
        const newTeam = (team.charSnowprintIds ?? [])
            .slice(0, 5)
            .map(charId => charactersBySnowprintId[charId])
            .filter((character): character is ICharacter2 => !!character)
            .map(character => ({
                character,
                teamId: team.id,
            }));

        if (team.restrictionsIds.length === 0 || newTeam.length === 0) {
            continue;
        }

        const startIndex = Math.max(
            0,
            ...team.restrictionsIds.map(restrictionId => (teamRecord[restrictionId] ?? []).length)
        );

        for (const restrictionId of team.restrictionsIds) {
            const column = teamRecord[restrictionId] ?? [];

            while (column.length < startIndex) {
                column.push(undefined);
            }

            for (const [index, entry] of newTeam.entries()) {
                column[startIndex + index] = entry;
            }

            teamRecord[restrictionId] = column;
        }
    }

    const size = Math.max(0, ...Object.values(teamRecord).map(x => x.length));
    const rows: Array<ITableRow<ISelectedTeamTableCell | string>> = Array.from({ length: size }, () => ({}));

    for (const [index, row] of rows.entries()) {
        for (const team in teamRecord) {
            const entry = teamRecord[team][index];
            row[team] = entry?.teamId ? entry : '';
        }
    }

    return rows;
}

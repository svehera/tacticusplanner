import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { GlobalState } from '@/models/global-state';
import { ILegendaryEventSelectedTeams, IPersonalData2 } from '@/models/interfaces';
import { convertData } from '@/services/personal-data.service';

import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

describe('PersonalDataLocalStorage LRE team migration', () => {
    it('migrates legacy team.characters to charSnowprintIds and stays coherent across import->export->import', () => {
        const runtimeState = new GlobalState(defaultData);
        const [firstCharacter, secondCharacter] = runtimeState.characters;
        const legacyCharacters = [
            { snowprintId: firstCharacter.snowprintId } as typeof firstCharacter,
            { snowprintId: secondCharacter.snowprintId } as typeof secondCharacter,
        ];

        const legacyEventTeams: ILegendaryEventSelectedTeams = {
            id: LegendaryEventEnum.JainZar,
            name: 'Jain Zar',
            teams: [
                {
                    id: 'legacy-team-1',
                    name: 'Legacy Team',
                    section: 'alpha',
                    restrictionsIds: ['restriction-1'],
                    characters: legacyCharacters,
                },
            ],
            alpha: {},
            beta: {},
            gamma: {},
        };

        const importedData: IPersonalData2 = {
            ...defaultData,
            schemaVersion: 2,
            leTeams: {
                ...defaultData.leTeams,
                [LegendaryEventEnum.JainZar]: legacyEventTeams,
            },
        };

        const firstImport = convertData(importedData);

        const firstTeam = firstImport.leTeams[LegendaryEventEnum.JainZar]!.teams[0];
        expect(firstTeam.charSnowprintIds).toEqual([firstCharacter.snowprintId, secondCharacter.snowprintId]);
        expect(firstTeam.charactersIds).toEqual([]);
        expect(firstTeam.characters).toBeUndefined();

        const exported = GlobalState.toStore(new GlobalState(firstImport));
        const exportedTeam = exported.leTeams[LegendaryEventEnum.JainZar]!.teams[0];
        expect(exportedTeam.charSnowprintIds).toEqual([firstCharacter.snowprintId, secondCharacter.snowprintId]);
        expect(exportedTeam.charactersIds).toEqual([]);
        expect(exportedTeam.characters).toBeUndefined();

        const secondImport = convertData(exported);

        const secondTeam = secondImport.leTeams[LegendaryEventEnum.JainZar]!.teams[0];
        expect(secondTeam.charSnowprintIds).toEqual([firstCharacter.snowprintId, secondCharacter.snowprintId]);
        expect(secondTeam.charactersIds).toEqual([]);
        expect(secondTeam.characters).toBeUndefined();
    });
});

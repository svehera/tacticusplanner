/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */

import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character/@x/unit';
import { IMow2 } from '@/fsd/4-entities/mow';

import { ITeam2 } from '../plan-teams2/models';
import { TeamFlow } from '../plan-teams2/team-flow';
import { Teams2Service } from '../plan-teams2/teams2.service';

import { TeamDropdown } from './team-dropdown';

interface Props {
    rarityCap: Rarity;
    chars: ICharacter2[];
    teams: ITeam2[];
    disabledTeamNames: string[];
    mows: IMow2[];
    team: ITeam2 | undefined;
    onSelectTeam: (teamName: string) => void;
    zoom?: number;
}

export const DeploymentZone = ({
    rarityCap,
    chars,
    mows,
    teams,
    disabledTeamNames,
    team,
    onSelectTeam,
    zoom = 1,
}: Props) => {
    return (
        <div className="flex min-w-[400px] flex-col items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <span>Rarity Cap:</span> <RarityIcon rarity={rarityCap} />
                <TeamDropdown
                    teams={teams}
                    chars={chars}
                    mows={mows}
                    selectedTeamName={team?.name}
                    disabledTeamNames={disabledTeamNames}
                    onSelect={onSelectTeam}
                />
            </div>
            <div style={{ minHeight: 230 * zoom }} className="flex w-full items-center justify-center">
                {team && (
                    <TeamFlow
                        chars={(
                            team.chars
                                .map((id: string) => chars.find(x => x.snowprintId === id))
                                .filter(x => x !== undefined) ?? []
                        ).map(x => Teams2Service.capCharacterAtRarity(x, rarityCap))}
                        mows={
                            team.mows
                                ?.map((id: string) => mows.find(x => x.snowprintId === id))
                                .filter(x => x !== undefined)
                                .map(x => Teams2Service.capMowAtRarity(x, rarityCap)) ?? []
                        }
                        flexIndex={team.flexIndex}
                        onCharClicked={() => {}}
                        onMowClicked={() => {}}
                        zoom={zoom}
                        disabledUnits={[]}
                    />
                )}
            </div>
        </div>
    );
};

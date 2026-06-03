/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronsUpDown } from 'lucide-react';
import React from 'react';

import { cn } from '@/fsd/5-shared/lib';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

import { ICharacter2 } from '@/fsd/4-entities/character/@x/unit';
import { IMow2 } from '@/fsd/4-entities/mow';

import { ITeam2 } from '../plan-teams2/models';

interface Props {
    teams: ITeam2[];
    chars: ICharacter2[];
    mows: IMow2[];
    disabledTeamNames: string[];
    selectedTeamName?: string;
    onSelect: (teamName: string) => void;
}

export const TeamDropdown: React.FC<Props> = ({
    teams,
    chars,
    mows,
    disabledTeamNames,
    selectedTeamName,
    onSelect,
}) => {
    const renderTeamIcons = (team: ITeam2) => {
        const flexIndex = team.flexIndex ?? team.chars.length;
        const core = team.chars.slice(0, flexIndex);
        const flex = team.chars.slice(flexIndex);

        return (
            <div className="flex items-center">
                <div className="flex items-center gap-1">
                    {core.map(id => {
                        const c = chars.find(x => x.snowprintId === id);
                        return <UnitShardIcon key={id} icon={c?.roundIcon ?? ''} name={id} height={28} width={28} />;
                    })}
                </div>

                {flex.length > 0 && <div className="mx-1" />}

                {flex.length > 0 && (
                    <div className="flex items-center gap-1">
                        {flex.map(id => {
                            const c = chars.find(x => x.snowprintId === id);
                            return (
                                <UnitShardIcon key={id} icon={c?.roundIcon ?? ''} name={id} height={28} width={28} />
                            );
                        })}
                    </div>
                )}

                {team.mows && team.mows.length > 0 && <div className="mx-1" />}

                {team.mows && team.mows.length > 0 && (
                    <div className="flex items-center gap-1">
                        {team.mows.map(mowId => {
                            const m = mows.find(x => x.snowprintId === mowId);
                            return (
                                <UnitShardIcon
                                    key={mowId}
                                    icon={m?.roundIcon ?? ''}
                                    name={mowId}
                                    height={28}
                                    width={28}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Listbox
            value={selectedTeamName ?? undefined}
            onChange={(value: string | undefined) => onSelect(value as unknown as string)}>
            <div className="relative">
                <ListboxButton className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-(--primary) transition-colors hover:bg-(--primary)/10 focus:ring-2 focus:ring-(--ring) focus:outline-none">
                    {selectedTeamName ?? 'SELECT A TEAM'}
                    <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                </ListboxButton>
                <ListboxOptions
                    anchor="bottom start"
                    className="z-50 mt-2 max-h-[min(60vh,24rem)] min-w-[280px] overflow-y-auto overscroll-contain rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl transition duration-100 ease-in focus:outline-none data-leave:opacity-0">
                    <ListboxOption
                        value={undefined}
                        className={({ focus }) =>
                            cn(
                                'flex cursor-pointer items-center px-3 py-2 text-sm transition-colors',
                                focus && 'bg-(--primary)/10'
                            )
                        }>
                        <span className="text-(--danger)">CLEAR</span>
                    </ListboxOption>
                    {teams.map(team => (
                        <ListboxOption
                            key={team.name}
                            value={team.name}
                            disabled={disabledTeamNames.includes(team.name)}
                            className={({ focus, disabled }) =>
                                cn(
                                    'flex cursor-pointer items-center justify-between gap-4 px-3 py-2 text-sm text-(--overlay-fg) transition-colors',
                                    focus && 'bg-(--primary)/10',
                                    disabled && 'cursor-not-allowed opacity-50'
                                )
                            }>
                            <span>{team.name}</span>
                            {renderTeamIcons(team)}
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
};

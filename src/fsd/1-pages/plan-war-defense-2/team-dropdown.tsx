/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { Button, Menu, MenuItem, Box } from '@mui/material';
import React, { useState } from 'react';

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
    const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);

    const open = Boolean(anchorElement);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElement(event.currentTarget);
    const handleClose = () => setAnchorElement(null);

    const handleSelect = (teamName: string) => {
        onSelect(teamName);
        handleClose();
    };

    const renderTeamIcons = (team: ITeam2) => {
        const flexIndex = team.flexIndex ?? team.chars.length;
        const core = team.chars.slice(0, flexIndex);
        const flex = team.chars.slice(flexIndex);

        return (
            <Box className="flex items-center">
                <Box className="flex items-center gap-1">
                    {core.map(id => {
                        const c = chars.find(x => x.snowprintId === id);
                        return <UnitShardIcon key={id} icon={c?.roundIcon ?? ''} name={id} height={28} width={28} />;
                    })}
                </Box>

                {flex.length > 0 && <Box className="mx-1" />}

                {flex.length > 0 && (
                    <Box className="flex items-center gap-1">
                        {flex.map(id => {
                            const c = chars.find(x => x.snowprintId === id);
                            return (
                                <UnitShardIcon key={id} icon={c?.roundIcon ?? ''} name={id} height={28} width={28} />
                            );
                        })}
                    </Box>
                )}

                {team.mows && team.mows.length > 0 && <Box className="mx-1" />}

                {team.mows && team.mows.length > 0 && (
                    <Box className="flex items-center gap-1">
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
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <div className="gap-4">
            <Button variant="text" onClick={handleOpen}>
                {selectedTeamName ?? 'SELECT A TEAM'}
            </Button>
            <Menu anchorEl={anchorElement} open={open} onClose={handleClose}>
                <MenuItem
                    onClick={() => {
                        onSelect(undefined as unknown as string);
                        handleClose();
                    }}>
                    <Box className="flex w-full items-center justify-between gap-2">
                        <Box className="text-sm text-red-600 dark:text-red-300">CLEAR</Box>
                    </Box>
                </MenuItem>
                {teams.map(team => (
                    <MenuItem
                        key={team.name}
                        onClick={() => handleSelect(team.name)}
                        disabled={disabledTeamNames.includes(team.name)}>
                        <Box className="flex w-full items-center justify-between gap-2">
                            <Box className="text-sm">{team.name}</Box>
                            <Box>{renderTeamIcons(team)}</Box>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
};

export default TeamDropdown;

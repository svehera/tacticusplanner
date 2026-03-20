/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { FormControl, Select, MenuItem, Box } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';

import { DeploymentZone } from './deployment-zone';

interface Zone {
    threeSlotRarity: Rarity;
    twoSlotRarity: Rarity;
}

const ZONES: Zone[] = [
    { threeSlotRarity: Rarity.Uncommon, twoSlotRarity: Rarity.Rare },
    { threeSlotRarity: Rarity.Rare, twoSlotRarity: Rarity.Epic },
    { threeSlotRarity: Rarity.Epic, twoSlotRarity: Rarity.Legendary },
    { threeSlotRarity: Rarity.Legendary, twoSlotRarity: Rarity.Mythic },
];

export const WarDefense2 = () => {
    const dispatch = useContext(DispatchContext);
    const { teams2, characters: unresolvedCharacters, mows: unresolvedMows, warDefense2 } = useContext(StoreContext);
    const [resolvedChars, setResolvedChars] = useState<ICharacter2[]>([]);
    const [resolvedMows, setResolvedMows] = useState<IMow2[]>([]);

    useEffect(() => {
        setResolvedChars(CharactersService.resolveStoredCharacters(unresolvedCharacters));
        setResolvedMows(MowsService.resolveAllFromStorage(unresolvedMows));
    }, [unresolvedCharacters, unresolvedMows]);
    const [zoom, setZoom] = useState(isMobile ? 0.5 : 1);

    const handleSelectedTeam = (index: number, teamName: string) => {
        const newDefense = cloneDeep(warDefense2);
        if (index === 0) newDefense.team1Name = teamName;
        else if (index === 1) newDefense.team2Name = teamName;
        else if (index === 2) newDefense.team3Name = teamName;
        else if (index === 3) newDefense.team4Name = teamName;
        else if (index === 4) newDefense.team5Name = teamName;
        dispatch.warDefense2({ type: 'Set', value: newDefense });
    };

    const handleZoneIndexChange = (index: number) => {
        const newDefense = cloneDeep(warDefense2);
        newDefense.zoneLevel = index;
        dispatch.warDefense2({ type: 'Set', value: newDefense });
    };

    const selectedTeams = [
        warDefense2.team1Name,
        warDefense2.team2Name,
        warDefense2.team3Name,
        warDefense2.team4Name,
        warDefense2.team5Name,
    ];

    return (
        <RosterSnapshotsAssetsProvider>
            <div className="gap-4">
                <div className="mb-4 flex items-center justify-center gap-4">
                    <Link
                        to={isMobile ? '/mobile/plan/waroffense2' : '/plan/waroffense2'}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-700">
                        Go to Offense
                    </Link>

                    <Link
                        to={isMobile ? '/mobile/plan/teams2' : '/plan/teams2'}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-700">
                        Go to Teams
                    </Link>

                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Battlefield Zone
                    </span>

                    <FormControl sx={{ minWidth: 160, width: 'auto' }}>
                        <Select
                            size="small"
                            value={warDefense2.zoneLevel ?? 0}
                            onChange={event => handleZoneIndexChange(Number(event.target.value))}
                            renderValue={value => {
                                const z = ZONES[Number(value)];
                                return (
                                    <Box className="flex items-center gap-1">
                                        <RarityIcon rarity={z.twoSlotRarity} />
                                        <RarityIcon rarity={z.twoSlotRarity} />
                                        <RarityIcon rarity={z.threeSlotRarity} />
                                        <RarityIcon rarity={z.threeSlotRarity} />
                                        <RarityIcon rarity={z.threeSlotRarity} />
                                    </Box>
                                );
                            }}>
                            {ZONES.map((zone, index) => (
                                <MenuItem key={index} value={index}>
                                    <Box className="flex items-center gap-1">
                                        <RarityIcon rarity={zone.twoSlotRarity} />
                                        <RarityIcon rarity={zone.twoSlotRarity} />
                                        <RarityIcon rarity={zone.threeSlotRarity} />
                                        <RarityIcon rarity={zone.threeSlotRarity} />
                                        <RarityIcon rarity={zone.threeSlotRarity} />
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <div className="flex items-start justify-start">
                        <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
                    </div>
                </div>
                <div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {[0, 1, 2, 3, 4].map(index => (
                            <DeploymentZone
                                key={`war-defense-team-${index}`}
                                rarityCap={
                                    index < 2
                                        ? ZONES[warDefense2.zoneLevel ?? 0].twoSlotRarity
                                        : ZONES[warDefense2.zoneLevel ?? 0].threeSlotRarity
                                }
                                teams={teams2.filter(t => t.warDefense)}
                                disabledTeamNames={teams2
                                    .filter(t => t.warDefense)
                                    .filter(t => t.name !== selectedTeams[index] && selectedTeams.includes(t.name))
                                    .map(t => t.name)}
                                team={teams2.find(t => t.name === selectedTeams[index])}
                                chars={resolvedChars}
                                mows={resolvedMows}
                                onSelectTeam={(teamName: string) => handleSelectedTeam(index, teamName)}
                                zoom={zoom}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </RosterSnapshotsAssetsProvider>
    );
};

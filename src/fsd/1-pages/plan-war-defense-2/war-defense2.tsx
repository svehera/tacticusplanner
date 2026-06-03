/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { cloneDeep } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';
import { LinkButton } from '@/fsd/5-shared/ui/link';
import { Select } from '@/fsd/5-shared/ui/selects';

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
        switch (index) {
            case 0: {
                newDefense.team1Name = teamName;
                break;
            }
            case 1: {
                newDefense.team2Name = teamName;
                break;
            }
            case 2: {
                newDefense.team3Name = teamName;
                break;
            }
            case 3: {
                newDefense.team4Name = teamName;
                break;
            }
            case 4: {
                {
                    newDefense.team5Name = teamName;
                    // No default
                }
                break;
            }
        }
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
                <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
                    <LinkButton href={isMobile ? '/mobile/plan/waroffense2' : '/plan/waroffense2'} size="small">
                        Go to Offense
                    </LinkButton>

                    <LinkButton href={isMobile ? '/mobile/plan/teams2' : '/plan/teams2'} size="small">
                        Go to Teams
                    </LinkButton>

                    <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                        Battlefield Zone
                    </span>

                    <Select<number>
                        options={[0, 1, 2, 3]}
                        value={warDefense2.zoneLevel ?? 0}
                        onChange={handleZoneIndexChange}
                        renderOption={index => (
                            <div className="flex items-center gap-1">
                                <RarityIcon rarity={ZONES[index].twoSlotRarity} />
                                <RarityIcon rarity={ZONES[index].twoSlotRarity} />
                                <RarityIcon rarity={ZONES[index].threeSlotRarity} />
                                <RarityIcon rarity={ZONES[index].threeSlotRarity} />
                                <RarityIcon rarity={ZONES[index].threeSlotRarity} />
                            </div>
                        )}
                        className="w-auto"
                    />

                    <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
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

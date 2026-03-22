/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { sum } from 'lodash';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { Rank, Rarity, useAuth, UnitType } from '@/fsd/5-shared/model';
import { RankSelect2, RaritySelect2, StarsSelect } from '@/fsd/5-shared/ui';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { CharactersService as FsdCharactersService } from '@/fsd/4-entities/character/characters.service';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit/ui/units-autocomplete';

import { CharacterItemDialog } from '@/fsd/3-features/character-details/character-item-dialog';
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
import { CharactersGrid } from '@/fsd/3-features/characters/components/characters-grid';
import { FactionsGrid } from '@/fsd/3-features/characters/components/factions-grid';
import { RosterHeader } from '@/fsd/3-features/characters/components/roster-header';
import { TeamGraph } from '@/fsd/3-features/characters/components/team-graph';
import { EditMowDialog } from '@/fsd/3-features/characters/dialogs/edit-mow-dialog';
import { isCharactersView } from '@/fsd/3-features/characters/functions/is-characters-view';
import { isFactionsView } from '@/fsd/3-features/characters/functions/is-factions-view';
import { ShareRoster } from '@/fsd/3-features/share/share-roster';
import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { TeamFlow } from '../plan-teams2/team-flow';

export const WhoYouOwn = () => {
    const { characters: charactersDefault, mows, viewPreferences, inventory } = useContext(StoreContext);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const resolvedCharacters = useMemo(
        () => FsdCharactersService.resolveStoredCharacters(charactersDefault),
        [charactersDefault]
    );
    const dispatch = useContext(DispatchContext);
    const navigate = useNavigate();

    const { token: isLoggedIn, shareToken: isRosterShared } = useAuth();

    const [viewControls, setViewControls] = useState<ICharactersViewControls>({
        filterBy: viewPreferences.wyoFilter,
        orderBy: viewPreferences.wyoOrder,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);
    const [editedCharacter, setEditedCharacter] = React.useState<ICharacter2 | null>(null);
    const [editedInventory, setEditedInventory] = React.useState<Record<string, number>>({});
    const [editedMow, setEditedMow] = React.useState<IMow2 | null>(null);

    // Bulk unit updater state
    const [bulkUnits, setBulkUnits] = useState<
        Array<{
            unit: IUnit | null;
            rank: Rank;
            rarity: Rarity;
            stars: number;
            activeAbilityLevel: number;
            passiveAbilityLevel: number;
        }>
    >([
        {
            unit: null,
            rank: Rank.Stone1,
            rarity: Rarity.Common,
            stars: 1,
            activeAbilityLevel: 1,
            passiveAbilityLevel: 1,
        },
        {
            unit: null,
            rank: Rank.Stone1,
            rarity: Rarity.Common,
            stars: 1,
            activeAbilityLevel: 1,
            passiveAbilityLevel: 1,
        },
        {
            unit: null,
            rank: Rank.Stone1,
            rarity: Rarity.Common,
            stars: 1,
            activeAbilityLevel: 1,
            passiveAbilityLevel: 1,
        },
        {
            unit: null,
            rank: Rank.Stone1,
            rarity: Rarity.Common,
            stars: 1,
            activeAbilityLevel: 1,
            passiveAbilityLevel: 1,
        },
        {
            unit: null,
            rank: Rank.Stone1,
            rarity: Rarity.Common,
            stars: 1,
            activeAbilityLevel: 1,
            passiveAbilityLevel: 1,
        },
    ]);

    const [searchParams] = useSearchParams();

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const hasShareParameters = !!sharedUser && !!shareToken;

    if (hasShareParameters) {
        navigate((isMobile ? '/mobile' : '') + `/sharedRoster?username=${sharedUser}&shareToken=${shareToken}`);
        return <></>;
    }

    const factionsView = isFactionsView(viewControls.orderBy);
    const charactersView = isCharactersView(viewControls.orderBy);

    const charactersFiltered = useMemo(() => {
        return CharactersService.filterUnits(
            [...resolvedCharacters, ...resolvedMows],
            viewControls.filterBy,
            nameFilter
        );
    }, [viewControls.filterBy, nameFilter, resolvedMows, resolvedCharacters]);

    const factions = useMemo(() => {
        return CharactersService.orderByFaction(
            charactersFiltered,
            viewControls.orderBy,
            viewPreferences.showBsValue,
            viewPreferences.showPower
        );
    }, [charactersFiltered, viewControls.orderBy, viewPreferences.showBsValue, viewPreferences.showPower]);

    const totalPower = useMemo(() => sum(factions.map(faction => faction.power)), [factions]);
    const totalValue = useMemo(() => sum(factions.map(faction => faction.bsValue)), [factions]);

    const units = useMemo(() => {
        return CharactersService.orderUnits(
            factions.flatMap(f => f.units),
            viewControls.orderBy
        );
    }, [factions, viewControls.orderBy]);

    const updatePreferences = useCallback(
        (value: ICharactersViewControls) => {
            setViewControls(value);
            dispatch.viewPreferences({ type: 'Update', setting: 'wyoOrder', value: value.orderBy });
            dispatch.viewPreferences({ type: 'Update', setting: 'wyoFilter', value: value.filterBy });
        },
        [dispatch]
    );

    const updateMow = useCallback(
        (mow: IMow2) => {
            endEditUnit();
            dispatch.inventory({
                type: 'DecrementUpgradeQuantity',
                upgrades: Object.entries(editedInventory).map(([id, count]) => ({ id, count })),
            });
            dispatch.mows({ type: 'Update', mow });
        },
        [dispatch, editedInventory]
    );

    const startEditUnit = useCallback((unit: IUnit): void => {
        if (unit.unitType === UnitType.character) {
            setEditedCharacter(unit);
            setEditedMow(null);
        }

        if (unit.unitType === UnitType.mow) {
            setEditedMow(unit);
            setEditedCharacter(null);
        }
    }, []);

    const startEditNextUnit = (currentUnit: IUnit): void => {
        const indexOfNextUnit = units.findIndex(x => x.id === currentUnit.id) + 1;
        const nextUnit = units[indexOfNextUnit >= units.length ? 0 : indexOfNextUnit];
        startEditUnit(nextUnit);
    };

    const startEditPreviousUnit = (currentUnit: IUnit): void => {
        const indexOfPreviousUnit = units.findIndex(x => x.id === currentUnit.id) - 1;
        const previousUnit = units[indexOfPreviousUnit < 0 ? units.length - 1 : indexOfPreviousUnit];
        startEditUnit(previousUnit);
    };

    const endEditUnit = useCallback((): void => {
        setEditedCharacter(null);
        setEditedMow(null);
    }, []);

    const handleApplyBulkUpdates = useCallback(() => {
        bulkUnits.forEach(entry => {
            if (entry.unit && 'snowprintId' in entry.unit) {
                const characterId = entry.unit.snowprintId;
                dispatch.characters({
                    type: 'UpdateRank',
                    character: characterId,
                    value: entry.rank,
                });
                dispatch.characters({
                    type: 'UpdateRarity',
                    character: characterId,
                    value: entry.rarity,
                });
                dispatch.characters({
                    type: 'UpdateStars',
                    character: characterId,
                    value: entry.stars,
                });
                dispatch.characters({
                    type: 'UpdateAbilities',
                    characterId: characterId,
                    abilities: [entry.activeAbilityLevel, entry.passiveAbilityLevel],
                });
            }
        });
    }, [bulkUnits, dispatch]);

    const copyFirstCharacterAttributes = useCallback(() => {
        setBulkUnits(previous => {
            const source = previous[0];

            return previous.map((entry, index) => {
                if (index === 0) {
                    return entry;
                }

                return {
                    ...entry,
                    rank: source.rank,
                    rarity: source.rarity,
                    stars: source.stars,
                    activeAbilityLevel: source.activeAbilityLevel,
                    passiveAbilityLevel: source.passiveAbilityLevel,
                };
            });
        });
    }, []);

    const bulkTeamCharacters = useMemo(() => {
        return bulkUnits
            .map(entry => {
                if (!entry.unit || !('snowprintId' in entry.unit)) return null;
                const char = resolvedCharacters.find(c => c.snowprintId === entry.unit!.snowprintId);
                if (!char) return null;
                return {
                    ...char,
                    rank: entry.rank,
                    rarity: entry.rarity,
                    stars: entry.stars,
                    activeAbilityLevel: entry.activeAbilityLevel,
                    passiveAbilityLevel: entry.passiveAbilityLevel,
                };
            })
            .filter((c): c is ICharacter2 => c !== null);
    }, [bulkUnits, resolvedCharacters]);

    return (
        <Box className="m-auto">
            <RosterSnapshotsAssetsProvider>
                <CharactersViewContext.Provider value={viewPreferences}>
                    <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                        {!!isLoggedIn && <ShareRoster isRosterShared={!!isRosterShared} />}
                        <TeamGraph units={charactersFiltered} />
                    </RosterHeader>
                    <CharactersViewControls viewControls={viewControls} viewControlsChanges={updatePreferences} />
                    <div className="min-h-[10px]" />

                    {/* Bulk Unit Updater */}
                    <Paper className="mb-4 bg-slate-100 p-4 dark:bg-slate-900">
                        <div className="mb-4 text-lg font-semibold">Bulk Unit Updater</div>
                        <Grid container spacing={2} className="mb-4">
                            {bulkUnits.map((entry, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                                    <div className="space-y-2">
                                        <UnitsAutocomplete
                                            unit={entry.unit}
                                            options={[...resolvedCharacters, ...resolvedMows]}
                                            onUnitChange={unit => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].unit = unit;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <RankSelect2
                                            label="Rank"
                                            rankValues={
                                                Object.values(Rank).filter(r => typeof r === 'number') as Rank[]
                                            }
                                            value={entry.rank}
                                            valueChanges={rank => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].rank = rank;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <RaritySelect2
                                            label="Rarity"
                                            rarityValues={
                                                Object.values(Rarity).filter(r => typeof r === 'number') as Rarity[]
                                            }
                                            value={entry.rarity}
                                            valueChanges={rarity => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].rarity = rarity;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <StarsSelect
                                            label="Stars"
                                            starsValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}
                                            value={entry.stars}
                                            valueChanges={stars => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].stars = stars;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <TextField
                                            label="Active Ability"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            inputProps={{ min: 1, max: 60 }}
                                            value={entry.activeAbilityLevel}
                                            onChange={event => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].activeAbilityLevel = Math.max(
                                                    1,
                                                    Math.min(60, parseInt(event.target.value) || 1)
                                                );
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <TextField
                                            label="Passive Ability"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            inputProps={{ min: 1, max: 60 }}
                                            value={entry.passiveAbilityLevel}
                                            onChange={event => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].passiveAbilityLevel = Math.max(
                                                    1,
                                                    Math.min(60, parseInt(event.target.value) || 1)
                                                );
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                        <div className="mb-4 flex flex-wrap gap-2">
                            <Button variant="outlined" onClick={copyFirstCharacterAttributes}>
                                Copy 1st Attributes to Others
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleApplyBulkUpdates}>
                                Apply Updates
                            </Button>
                        </div>
                        {bulkTeamCharacters.length > 0 && (
                            <div className="mt-4">
                                <div className="mb-2 text-sm font-semibold">Preview:</div>
                                <TeamFlow
                                    chars={bulkTeamCharacters}
                                    mows={[]}
                                    onCharClicked={() => {}}
                                    onMowClicked={() => {}}
                                />
                            </div>
                        )}
                    </Paper>

                    {/* Bulk Unit Updater */}
                    <Paper className="mb-4 bg-slate-100 p-4 dark:bg-slate-900">
                        <div className="mb-4 text-lg font-semibold">Bulk Unit Updater</div>
                        <Grid container spacing={2} className="mb-4">
                            {bulkUnits.map((entry, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                                    <div className="space-y-2">
                                        <UnitsAutocomplete
                                            unit={entry.unit}
                                            options={[...resolvedCharacters, ...resolvedMows]}
                                            onUnitChange={unit => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].unit = unit;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <RankSelect2
                                            label="Rank"
                                            rankValues={
                                                Object.values(Rank).filter(r => typeof r === 'number') as Rank[]
                                            }
                                            value={entry.rank}
                                            valueChanges={rank => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].rank = rank;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <RaritySelect2
                                            label="Rarity"
                                            rarityValues={
                                                Object.values(Rarity).filter(r => typeof r === 'number') as Rarity[]
                                            }
                                            value={entry.rarity}
                                            valueChanges={rarity => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].rarity = rarity;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <StarsSelect
                                            label="Stars"
                                            starsValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}
                                            value={entry.stars}
                                            valueChanges={stars => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].stars = stars;
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <TextField
                                            label="Active Ability"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            inputProps={{ min: 1, max: 60 }}
                                            value={entry.activeAbilityLevel}
                                            onChange={event => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].activeAbilityLevel = Math.max(
                                                    1,
                                                    Math.min(60, parseInt(event.target.value) || 1)
                                                );
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                        <TextField
                                            label="Passive Ability"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            inputProps={{ min: 1, max: 60 }}
                                            value={entry.passiveAbilityLevel}
                                            onChange={event => {
                                                const newBulkUnits = [...bulkUnits];
                                                newBulkUnits[index].passiveAbilityLevel = Math.max(
                                                    1,
                                                    Math.min(60, parseInt(event.target.value) || 1)
                                                );
                                                setBulkUnits(newBulkUnits);
                                            }}
                                        />
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                        <div className="mb-4 flex flex-wrap gap-2">
                            <Button variant="outlined" onClick={copyFirstCharacterAttributes}>
                                Copy 1st Attributes to Others
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleApplyBulkUpdates}>
                                Apply Updates
                            </Button>
                        </div>
                        {bulkTeamCharacters.length > 0 && (
                            <div className="mt-4">
                                <div className="mb-2 text-sm font-semibold">Preview:</div>
                                <TeamFlow
                                    chars={bulkTeamCharacters}
                                    mows={[]}
                                    onCharClicked={() => {}}
                                    onMowClicked={() => {}}
                                />
                            </div>
                        )}
                    </Paper>

                    {factionsView && <FactionsGrid factions={factions} onCharacterClick={startEditUnit} />}

                    {charactersView && (
                        <CharactersGrid
                            characters={units}
                            onAvailableCharacterClick={startEditUnit}
                            onLockedCharacterClick={startEditUnit}
                        />
                    )}

                    {editedCharacter && (
                        <CharacterItemDialog
                            key={editedCharacter.id}
                            character={editedCharacter}
                            isOpen={!!editedCharacter}
                            showNextUnit={() => startEditNextUnit(editedCharacter)}
                            showPreviousUnit={() => startEditPreviousUnit(editedCharacter)}
                            onClose={endEditUnit}
                        />
                    )}

                    {editedMow && (
                        <EditMowDialog
                            key={editedMow.snowprintId}
                            mow={editedMow}
                            saveChanges={updateMow}
                            isOpen={!!editedMow}
                            onClose={endEditUnit}
                            inventory={inventory.upgrades}
                            showNextUnit={updatedMow => {
                                updateMow(updatedMow);
                                startEditNextUnit(editedMow);
                            }}
                            showPreviousUnit={updatedMow => {
                                updateMow(updatedMow);
                                startEditPreviousUnit(editedMow);
                            }}
                            inventoryUpdate={setEditedInventory}
                        />
                    )}
                </CharactersViewContext.Provider>
            </RosterSnapshotsAssetsProvider>
        </Box>
    );
};

/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import Box from '@mui/material/Box';
import { sum } from 'lodash';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { useAuth, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { CharactersService as FsdCharactersService } from '@/fsd/4-entities/character/characters.service';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

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

import { CharacterDetailsPage } from './character-details-page';

export const WhoYouOwn = () => {
    const { characters: charactersDefault, mows, viewPreferences, inventory } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const navigate = useNavigate();
    const { token: isLoggedIn, shareToken: isRosterShared } = useAuth();

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const resolvedCharacters = useMemo(
        () => FsdCharactersService.resolveStoredCharacters(charactersDefault),
        [charactersDefault]
    );

    const [viewControls, setViewControls] = useState<ICharactersViewControls>({
        filterBy: viewPreferences.wyoFilter,
        orderBy: viewPreferences.wyoOrder,
    });
    const [nameFilter, setNameFilter] = useState<string>();
    const [editedCharacter, setEditedCharacter] = useState<ICharacter2>();
    const [editedInventory, setEditedInventory] = useState<Record<string, number>>({});
    const [editedMow, setEditedMow] = useState<IMow2>();

    const [searchParams, setSearchParameters] = useSearchParams();

    const factionsView = isFactionsView(viewControls.orderBy);
    const charactersView = isCharactersView(viewControls.orderBy);

    const charactersFiltered = useMemo(
        () =>
            CharactersService.filterUnits([...resolvedCharacters, ...resolvedMows], viewControls.filterBy, nameFilter),
        [viewControls.filterBy, nameFilter, resolvedMows, resolvedCharacters]
    );

    const factions = useMemo(
        () =>
            CharactersService.orderByFaction(
                charactersFiltered,
                viewControls.orderBy,
                viewPreferences.showBsValue,
                viewPreferences.showPower
            ),
        [charactersFiltered, viewControls.orderBy, viewPreferences.showBsValue, viewPreferences.showPower]
    );

    const totalPower = useMemo(() => sum(factions.map(faction => faction.power)), [factions]);
    const totalValue = useMemo(() => sum(factions.map(faction => faction.bsValue)), [factions]);

    const units = useMemo(
        () =>
            CharactersService.orderUnits(
                factions.flatMap(f => f.units),
                viewControls.orderBy
            ),
        [factions, viewControls.orderBy]
    );

    // Characters only (no MoWs) for the details page nav list, preserving roster order
    const characterUnits = useMemo(
        () => units.filter((u): u is ICharacter2 => u.unitType === UnitType.character),
        [units]
    );

    const characterId = searchParams.get('character');
    const currentCharIndex = useMemo(
        () => (characterId ? characterUnits.findIndex(u => u.snowprintId === characterId) : -1),
        [characterId, characterUnits]
    );

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
            setEditedMow(undefined);
        }
        if (unit.unitType === UnitType.mow) {
            setEditedMow(unit);
            setEditedCharacter(undefined);
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
        setEditedCharacter(undefined);
        setEditedMow(undefined);
    }, []);

    const handleCharacterClick = useCallback(
        (unit: IUnit) => {
            if (unit.unitType !== UnitType.character) return;
            setSearchParameters({ character: unit.snowprintId });
        },
        [setSearchParameters]
    );

    // ── Early returns (all hooks above this line) ──────────────────────────────

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');
    if (sharedUser && shareToken) {
        navigate(`/sharedRoster?username=${sharedUser}&shareToken=${shareToken}`);
        return <></>;
    }

    // Character details page — replaces the old dialog
    if (characterId) {
        const selectedChar = currentCharIndex >= 0 ? characterUnits[currentCharIndex] : undefined;
        if (selectedChar) {
            return (
                <CharacterDetailsPage
                    key={selectedChar.snowprintId}
                    char={selectedChar}
                    prevChar={characterUnits[currentCharIndex - 1]}
                    nextChar={characterUnits[currentCharIndex + 1]}
                />
            );
        }
    }

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

                    {factionsView && <FactionsGrid factions={factions} onCharacterClick={handleCharacterClick} />}

                    {charactersView && (
                        <CharactersGrid
                            characters={units}
                            onAvailableCharacterClick={handleCharacterClick}
                            onLockedCharacterClick={handleCharacterClick}
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

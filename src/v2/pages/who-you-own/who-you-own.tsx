import Box from '@mui/material/Box';
import { sum } from 'lodash';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { useAuth, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { CharactersService as FsdCharactersService } from '@/fsd/4-entities/character/characters.service';
import { IMow2, mows2Data, MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { CharacterItemDialog } from '@/fsd/3-features/character-details/character-item-dialog';
import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';
import { EditMowDialog } from 'src/v2/features/characters/dialogs/edit-mow-dialog';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { ShareRoster } from 'src/v2/features/share/share-roster';

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

    const [searchParams] = useSearchParams();

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const hasShareParams = !!sharedUser && !!shareToken;

    if (hasShareParams) {
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

    const updatePreferences = useCallback((value: ICharactersViewControls) => {
        setViewControls(value);
        dispatch.viewPreferences({ type: 'Update', setting: 'wyoOrder', value: value.orderBy });
        dispatch.viewPreferences({ type: 'Update', setting: 'wyoFilter', value: value.filterBy });
    }, []);

    const updateMow = useCallback((mow: IMow2) => {
        endEditUnit();
        dispatch.inventory({
            type: 'DecrementUpgradeQuantity',
            upgrades: Object.entries(editedInventory).map(([id, count]) => ({ id, count })),
        });
        dispatch.mows({ type: 'Update', mow });
    }, []);

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

    return (
        <Box style={{ margin: 'auto' }}>
            <CharactersViewContext.Provider value={viewPreferences}>
                <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                    {!!isLoggedIn && <ShareRoster isRosterShared={!!isRosterShared} />}
                    <TeamGraph units={charactersFiltered} />
                </RosterHeader>
                <CharactersViewControls viewControls={viewControls} viewControlsChanges={updatePreferences} />

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
        </Box>
    );
};

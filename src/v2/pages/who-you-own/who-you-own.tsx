import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { isMobile } from 'react-device-detect';
import { sum } from 'lodash';

import FactionsGrid from 'src/v2/features/characters/components/factions-grid';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import ViewControls from 'src/v2/features/characters/components/view-controls';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';
import { IMow, IUnit, IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';

import { ShareRoster } from 'src/v2/features/share/share-roster';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharacterItemDialog } from 'src/shared-components/character-item-dialog';
import { ICharacter2 } from 'src/models/interfaces';
import { useAuth } from 'src/contexts/auth';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { EditMowDialog } from 'src/v2/features/characters/dialogs/edit-mow-dialog';

export const WhoYouOwn = () => {
    const { characters: charactersDefault, mows, viewPreferences, inventory } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const navigate = useNavigate();

    const { token: isLoggedIn, shareToken: isRosterShared } = useAuth();

    const [viewControls, setViewControls] = useState<IViewControls>({
        filterBy: viewPreferences.wyoFilter,
        orderBy: viewPreferences.wyoOrder,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);
    const [openCharacterItemDialog, setOpenCharacterItemDialog] = React.useState(false);
    const [editedCharacter, setEditedCharacter] = React.useState<ICharacter2 | null>(null);
    const [editedInventory, setEditedInventory] = React.useState<Record<string, number>>({});
    const [openEditMowDialog, setOpenEditMowDialog] = React.useState(false);
    const [editedMow, setEditedMow] = React.useState<IMow | null>(null);

    const [searchParams] = useSearchParams();

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const hasShareParams = !!sharedUser && !!shareToken;

    if (hasShareParams) {
        useEffect(() => {
            navigate((isMobile ? '/mobile' : '') + `/sharedRoster?username=${sharedUser}&shareToken=${shareToken}`);
        }, []);
        return <></>;
    }

    const charactersFiltered = useMemo(() => {
        return CharactersService.filterUnits([...charactersDefault, ...mows], viewControls.filterBy, nameFilter);
    }, [viewControls.filterBy, nameFilter]);

    const totalPower = sum(charactersFiltered.map(character => CharactersPowerService.getCharacterPower(character)));
    const totalValue = sum(charactersFiltered.map(character => CharactersValueService.getCharacterValue(character)));

    const factions = useMemo(() => {
        return CharactersService.orderByFaction(charactersFiltered, viewControls.orderBy);
    }, [charactersFiltered, viewControls.orderBy]);

    const units = useMemo(() => {
        return CharactersService.orderUnits(
            factions.flatMap(f => f.units),
            viewControls.orderBy
        );
    }, [factions, viewControls.orderBy]);

    const updatePreferences = useCallback(() => {
        return (value: IViewControls) => {
            setViewControls(value);
            dispatch.viewPreferences({ type: 'Update', setting: 'wyoOrder', value: value.orderBy });
            dispatch.viewPreferences({ type: 'Update', setting: 'wyoFilter', value: value.filterBy });
        };
    }, []);

    const updateMow = (mow: IMow) => {
        endEditUnit();
        dispatch.inventory({
            type: 'DecrementUpgradeQuantity',
            upgrades: Object.entries(editedInventory).map(([id, count]) => ({ id, count })),
        });
        dispatch.mows({ type: 'Update', mow });
    };

    const startEditUnit = useCallback((unit: IUnit): void => {
        if (unit.unitType === UnitType.character) {
            setEditedCharacter(unit);
            setOpenCharacterItemDialog(true);
            setOpenEditMowDialog(false);
        }

        if (unit.unitType === UnitType.mow) {
            setEditedMow(unit);
            setOpenEditMowDialog(true);
            setOpenCharacterItemDialog(false);
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

    const endEditUnit = (): void => {
        setEditedCharacter(null);
        setOpenCharacterItemDialog(false);

        setEditedMow(null);
        setOpenEditMowDialog(false);
    };

    const factionsView = isFactionsView(viewControls.orderBy);
    const charactersView = isCharactersView(viewControls.orderBy);

    return (
        <Box style={{ margin: 'auto' }}>
            <CharactersViewContext.Provider value={viewPreferences}>
                <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                    {!!isLoggedIn && <ShareRoster isRosterShared={!!isRosterShared} />}
                    <TeamGraph units={charactersFiltered} />
                </RosterHeader>
                <ViewControls viewControls={viewControls} viewControlsChanges={updatePreferences} />

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
                        isOpen={openCharacterItemDialog}
                        showNextUnit={() => startEditNextUnit(editedCharacter)}
                        showPreviousUnit={() => startEditPreviousUnit(editedCharacter)}
                        onClose={endEditUnit}
                    />
                )}

                {editedMow && (
                    <EditMowDialog
                        key={editedMow.id}
                        mow={editedMow}
                        saveChanges={updateMow}
                        isOpen={openEditMowDialog}
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

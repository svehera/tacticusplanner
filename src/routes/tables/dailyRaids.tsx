import React, { useContext, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

import { ICharacter2, IDailyRaidsFilters } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import {
    CharacterRaidGoalSelect,
    IEstimatedShards,
    IEstimatedUpgrades,
    IItemRaidLocation,
} from 'src/v2/features/goals/goals.models';
import { LocationsFilter } from 'src/v2/features/goals/locations-filter';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

import { TodayRaids } from 'src/routes/tables/todayRaids';
import { ActiveGoalsDialog } from 'src/v2/features/goals/active-goals-dialog';
import { RaidsPlan } from 'src/routes/tables/raids-plan';
import { RaidsHeader } from 'src/routes/tables/raids-header';

import './dailyRaids.scss';

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const {
        dailyRaids,
        characters: storeCharacters,
        goals,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
    } = useContext(StoreContext);

    const [hasChanges, setHasChanges] = React.useState<boolean>(false);
    const [upgrades, setUpgrades] = React.useState<Record<string, number>>(inventory.upgrades);
    const [characters, setCharacters] = React.useState<ICharacter2[]>(storeCharacters);

    const { allGoals, shardsGoals, upgradeRankGoals } = useMemo(() => {
        return GoalsService.prepareGoals(goals, characters);
    }, [goals, characters]);

    const handleUpgradesAdd = (upgradeId: string, value: number, location: IItemRaidLocation) => {
        setHasChanges(true);

        if (value > 0) {
            dispatch.inventory({
                type: 'IncrementUpgradeQuantity',
                upgrade: upgradeId,
                value,
            });
            enqueueSnackbar(`Added ${value} items for ${upgradeId}`, {
                variant: 'success',
            });
        }

        dispatch.dailyRaids({
            type: 'AddCompletedBattle',
            location,
        });
    };

    const handleShardsAdd = (characterId: string, value: number, location: IItemRaidLocation) => {
        setHasChanges(true);

        if (value > 0) {
            dispatch.characters({
                type: 'IncrementShards',
                character: characterId,
                value: value,
            });
            enqueueSnackbar(`Added ${value} shards for ${characterId}`, {
                variant: 'success',
            });
        }

        dispatch.dailyRaids({
            type: 'AddCompletedBattle',
            location,
        });
    };

    const handleGoalsSelectionChange = (selection: CharacterRaidGoalSelect[]) => {
        dispatch.goals({
            type: 'UpdateDailyRaids',
            value: selection.map(x => ({ goalId: x.goalId, include: x.include })),
        });
    };

    const saveInventoryUpdateChanges = (materialId: string, value: number): void => {
        dispatch.inventory({
            type: 'UpdateUpgradeQuantity',
            upgrade: materialId,
            value: value,
        });
        setHasChanges(true);
    };

    const refresh = () => {
        setUpgrades({ ...inventory.upgrades });
        setCharacters([...storeCharacters]);
        setHasChanges(false);
    };

    const resetDay = () => {
        dispatch.dailyRaids({ type: 'ResetCompletedBattles' });
        setHasChanges(false);
        setTimeout(() => {
            setUpgrades({ ...inventory.upgrades });
            setCharacters([...storeCharacters]);
        }, 100);
    };

    const saveFilterChanges = (filters: IDailyRaidsFilters) => {
        dispatch.dailyRaids({
            type: 'UpdateFilters',
            value: filters,
        });
    };

    const estimatedShards: IEstimatedShards = useMemo(() => {
        return ShardsService.getShardsEstimatedDays(
            {
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                raidedLocations: dailyRaids.raidedLocations,
            },
            ...shardsGoals
        );
    }, [shardsGoals, dailyRaidsPreferences]);

    const actualEnergy = useMemo(() => {
        return dailyRaidsPreferences.dailyEnergy - estimatedShards.energyPerDay;
    }, [dailyRaidsPreferences.dailyEnergy, estimatedShards.energyPerDay]);

    const estimatedRanks: IEstimatedUpgrades = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: actualEnergy,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: upgrades,
                completedLocations: dailyRaids.raidedLocations?.filter(x => !x.isShardsLocation) ?? [],
                filters: dailyRaids.filters,
            },
            ...upgradeRankGoals
        );
    }, [actualEnergy, upgradeRankGoals, dailyRaidsPreferences, dailyRaids.filters, upgrades]);

    const energyDescription = `${actualEnergy} ${
        estimatedShards.energyPerDay > 0 && `= ${dailyRaidsPreferences.dailyEnergy} - ${estimatedShards.energyPerDay}`
    }`;

    return (
        <div>
            <RaidsHeader
                actualDailyEnergy={energyDescription}
                refreshDisabled={!hasChanges}
                refreshHandle={refresh}
                resetDisabled={!dailyRaids.raidedLocations?.length}
                resetHandler={resetDay}>
                <ActiveGoalsDialog
                    characters={characters}
                    goals={allGoals}
                    onGoalsSelectChange={handleGoalsSelectionChange}
                />
                <LocationsFilter filter={dailyRaids.filters} filtersChange={saveFilterChanges} />
            </RaidsHeader>

            <RaidsPlan
                estimatedShards={estimatedShards}
                estimatedRanks={estimatedRanks}
                upgrades={inventory.upgrades}
                updateInventory={saveInventoryUpdateChanges}
            />

            <TodayRaids
                completedLocations={dailyRaids.raidedLocations}
                shardsRaids={estimatedShards.shardsRaids}
                upgradesRaids={estimatedRanks.upgradesRaids[0]?.raids ?? []}
                addShards={handleShardsAdd}
                addUpgrades={handleUpgradesAdd}
            />
        </div>
    );
};

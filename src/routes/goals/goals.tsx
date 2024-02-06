import React, { useContext, useMemo, useState } from 'react';
import { EditGoalDialog, SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import {
    ICampaignBattleComposed,
    ICampaignsProgress,
    ICharacter2,
    ICharacterRankRange,
    IMaterialRaid,
    IPersonalGoal,
    IRaidLocation,
} from '../../models/interfaces';
import { PersonalGoalType, Rank } from '../../models/enums';

import { RankImage } from '../../shared-components/rank-image';
import { RarityImage } from '../../shared-components/rarity-image';
import { CharacterTitle } from '../../shared-components/character-title';
import { Card, CardContent, CardHeader, FormControlLabel, Input, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { ArrowForward, DeleteForever, Edit, Info } from '@mui/icons-material';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { StaticDataService } from '../../services';
import { charsProgression, charsUnlockShards, defaultCampaignsProgress, rarityToStars } from '../../models/constants';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { CampaignImage } from '../../shared-components/campaign-image';
import { enqueueSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import { MiscIcon } from '../../shared-components/misc-icon';

export const Goals = () => {
    const { goals, characters, campaignsProgress, dailyRaidsPreferences, inventory, dailyRaids } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<IPersonalGoal | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);

    const estimatedDaysTotal = useMemo(() => {
        const chars = goals
            .filter(x => x.type === PersonalGoalType.UpgradeRank)
            .map(g => {
                const char = characters.find(c => c.name === g.character);
                if (char) {
                    return {
                        id: g.character,
                        rankStart: char.rank,
                        rankEnd: g.targetRank!,
                        appliedUpgrades: char.upgrades,
                    } as ICharacterRankRange;
                }
                return null;
            })
            .filter(x => !!x) as ICharacterRankRange[];

        const estimate = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                campaignsProgress: dailyRaidsPreferences.useCampaignsProgress
                    ? campaignsProgress
                    : defaultCampaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: dailyRaidsPreferences.useInventory ? inventory.upgrades : {},
                completedLocations: dailyRaids.completedLocations ?? [],
            },
            ...chars
        );

        return estimate;
    }, [goals]);

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const handleMenuItemSelect = (goal: IPersonalGoal, item: 'edit' | 'delete') => {
        if (item === 'delete') {
            if (confirm('Are you sure? The goal will be permanently deleted!')) {
                removeGoal(goal.id);
            }
        }

        if (item === 'edit') {
            const relatedCharacter = characters.find(x => x.name === goal.character);
            if (relatedCharacter) {
                setEditCharacter(relatedCharacter);
                setEditGoal({
                    ...goal,
                    currentShards: relatedCharacter.shards,
                    currentRank: relatedCharacter.rank,
                    currentRarity: relatedCharacter.rarity,
                    upgrades: relatedCharacter.upgrades,
                });
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
                <SetGoalDialog key={goals.length} />
                {editGoal ? (
                    <EditGoalDialog
                        isOpen={true}
                        goal={editGoal}
                        character={editCharacter}
                        onClose={() => {
                            setEditGoal(null);
                        }}
                    />
                ) : undefined}
                <span style={{ fontSize: 20 }}>
                    {goals.length}/{20}
                </span>
                <span style={{ fontSize: 20 }}>
                    Total Days: {estimatedDaysTotal.raids.length}{' '}
                    <IconButton
                        color={'primary'}
                        component={Link}
                        to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                        <Tooltip title={'Go To Daily Raids'}>
                            <Info />
                        </Tooltip>
                    </IconButton>{' '}
                </span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className={'goals'}>
                {goals.map(goal => (
                    <GoalCard
                        key={goal.id + goal.priority}
                        goal={goal}
                        higherPriorityGoals={goals.filter(g => g.type === goal.type && g.priority < goal.priority)}
                        menuItemSelect={item => handleMenuItemSelect(goal, item)}
                    />
                ))}
            </div>
        </div>
    );
};

export const GoalCard = ({
    goal,
    menuItemSelect,
    higherPriorityGoals,
    onClick,
}: {
    goal: IPersonalGoal;
    higherPriorityGoals: IPersonalGoal[];
    menuItemSelect?: (item: 'edit' | 'delete') => void;
    onClick?: () => void;
}) => {
    const { characters, campaignsProgress, dailyRaidsPreferences, inventory, dailyRaids } = useContext(StoreContext);
    const character = characters.find(x => x.name === goal.character) as ICharacter2;
    const isGoalCompleted = useMemo(() => {
        return (
            (goal.type === PersonalGoalType.UpgradeRank && character.rank >= goal.targetRank!) ||
            (goal.type === PersonalGoalType.Ascend && character.rarity >= goal.targetRarity!) ||
            (goal.type === PersonalGoalType.Unlock && character.rank > Rank.Locked)
        );
    }, [goal, character]);

    let goalShards = 0;
    let possibleLocations: ICampaignBattleComposed[] = [];
    if (goal.type === PersonalGoalType.Ascend) {
        const currentCharProgression = character.rarity + character.stars;
        const targetProgression = goal.targetRarity! + rarityToStars[goal.targetRarity!];

        goalShards = 0;

        for (let i = currentCharProgression + 1; i <= targetProgression; i++) {
            const progressionRequirements = charsProgression[i];
            goalShards += progressionRequirements.shards;
        }
    }

    if (goal.type === PersonalGoalType.Unlock) {
        goalShards = charsUnlockShards[character.rarity];
    }

    if (goal.type === PersonalGoalType.Unlock || goal.type === PersonalGoalType.Ascend) {
        const characterShardsData = StaticDataService.recipeDataFull[character.name];
        if (characterShardsData) {
            const fullData = characterShardsData.allMaterials && characterShardsData.allMaterials[0];
            if (fullData) possibleLocations = fullData.locationsComposed ?? [];
        }
    }
    goal.shardsPerDayOrToken ??= 3;
    const isOnslaughtMode = goal.type === PersonalGoalType.Ascend && !possibleLocations.length;
    const isAnyLocationsUnlocked =
        possibleLocations.length &&
        possibleLocations.some(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        });
    const isLuckyUnlockMode = goal.type === PersonalGoalType.Unlock && !isAnyLocationsUnlocked;
    const shardsLeftToScore = goalShards && goalShards - character.shards;
    const daysOrTokensLeft =
        shardsLeftToScore && shardsLeftToScore > 0 ? Math.ceil(shardsLeftToScore / goal.shardsPerDayOrToken) : 0;

    const estimatedDays = useMemo(() => {
        if (goal.type !== PersonalGoalType.UpgradeRank) {
            return {
                total: 0,
                byOrder: 0,
            };
        }
        const charactersRankRange = higherPriorityGoals
            .map(g => {
                const char = characters.find(c => c.name === g.character);
                if (char) {
                    return {
                        id: g.character,
                        rankStart: char.rank,
                        rankEnd: g.targetRank!,
                        appliedUpgrades: char.upgrades,
                    } as ICharacterRankRange;
                }
            })
            .filter(x => !!x) as ICharacterRankRange[];

        const estimate = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                campaignsProgress: dailyRaidsPreferences.useCampaignsProgress
                    ? campaignsProgress
                    : defaultCampaignsProgress,
                preferences: dailyRaidsPreferences, // { ...dailyRaidsPreferences, farmByPriorityOrder: true },
                upgrades: dailyRaidsPreferences.useInventory ? inventory.upgrades : {},
                completedLocations: dailyRaids.completedLocations ?? [],
            },
            ...[
                ...charactersRankRange,
                {
                    id: character.name,
                    rankStart: character.rank,
                    rankEnd: goal.targetRank!,
                    appliedUpgrades: character.upgrades,
                },
            ]
        );

        const firstFarmDay = estimate.raids.findIndex(x =>
            x.raids.flatMap(raid => raid.characters).includes(character.name)
        );

        return {
            total: estimate.raids.length,
            byOrder:
                firstFarmDay +
                estimate.raids.filter(x => x.raids.flatMap(raid => raid.characters).includes(character.name)).length,
        };
    }, [character.name, character.rank, goal.targetRank, higherPriorityGoals]);

    return (
        <Card
            onClick={onClick}
            sx={{
                width: 350,
                minHeight: 200,
                backgroundColor: isGoalCompleted ? 'lightgreen' : 'white',
                cursor: onClick ? 'pointer' : undefined,
            }}>
            <CardHeader
                action={
                    menuItemSelect ? (
                        <React.Fragment>
                            {!isGoalCompleted ? (
                                <IconButton onClick={() => menuItemSelect('edit')}>
                                    <Edit fontSize="small" />
                                </IconButton>
                            ) : undefined}
                            <IconButton onClick={() => menuItemSelect('delete')}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </React.Fragment>
                    ) : undefined
                }
                title={
                    <div style={{ display: 'flex', gap: 5 }}>
                        <span>#{goal.priority}</span>{' '}
                        <CharacterTitle character={character} short={true} imageSize={30} />
                    </div>
                }
                subheader={PersonalGoalType[goal.type]}
            />
            <CardContent>
                {goal.type === PersonalGoalType.UpgradeRank ? (
                    <div>
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <RankImage rank={character.rank} /> <ArrowForward />{' '}
                            <RankImage rank={goal.targetRank ?? 0} />
                        </div>
                        {isGoalCompleted ? undefined : (
                            <Tooltip
                                title={'Day/s left takes into consideration the highest planned item across all goals'}>
                                <span>
                                    Days Left: <span className="bold">{estimatedDays.total}</span> (
                                    {estimatedDays.byOrder})
                                </span>
                            </Tooltip>
                        )}
                    </div>
                ) : undefined}

                {goal.type === PersonalGoalType.Ascend ? (
                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <RarityImage rarity={character.rarity} />
                        <ArrowForward /> <RarityImage rarity={goal.targetRarity ?? 0} />
                    </div>
                ) : undefined}
                {goal.type === PersonalGoalType.Unlock || goal.type === PersonalGoalType.Ascend ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>
                            {isOnslaughtMode ? 'Tokens' : 'Days'} Left: <span className="bold">{daysOrTokensLeft}</span>{' '}
                            <>
                                ({goal.shardsPerDayOrToken} Shards
                                {goal.energyPerDay ? (
                                    <>
                                        {' and '}
                                        <span>{goal.energyPerDay}</span>{' '}
                                        <MiscIcon icon={'energy'} width={15} height={15} />
                                    </>
                                ) : undefined}{' '}
                                per {isOnslaughtMode ? 'token' : 'day'}
                                {isLuckyUnlockMode ? (
                                    <>{' or ' + StaticDataService.getFactionPray(character.faction)}</>
                                ) : undefined}
                                )
                            </>
                        </span>
                        {isOnslaughtMode ? (
                            <span>
                                Days Left: <span className="bold">{Math.ceil(daysOrTokensLeft / 1.5)}</span>
                            </span>
                        ) : undefined}
                        <span>
                            <span className="bold">
                                {character.shards} of {goalShards}
                            </span>{' '}
                            Shards
                        </span>
                        {possibleLocations.length ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {possibleLocations.map(location => (
                                    <RaidItem
                                        key={location.campaign + location.nodeNumber}
                                        material={{
                                            materialId: character.name,
                                            materialLabel: character.name,
                                            materialRarity: character.rarity,
                                            totalCount: goalShards,
                                            materialIconPath: '',
                                            characterIconPath: character.icon,
                                            characters: [character.name],
                                            locations: [],
                                        }}
                                        location={{
                                            id: location.campaign + location.nodeNumber,
                                            campaign: location.campaign,
                                            battleNumber: location.nodeNumber,
                                            raidsCount: location.dailyBattleCount,
                                            farmedItems: Math.round(location.dropRate * location.dailyBattleCount),
                                            energySpent: location.energyCost * location.dailyBattleCount,
                                        }}
                                    />
                                ))}
                            </div>
                        ) : goal.type === PersonalGoalType.Ascend ? (
                            <>
                                <RaidItem
                                    material={{
                                        materialId: character.name,
                                        materialLabel: character.name,
                                        materialRarity: character.rarity,
                                        totalCount: goalShards,
                                        materialIconPath: '',
                                        characterIconPath: character.icon,
                                        characters: [character.name],
                                        locations: [],
                                    }}
                                    location={{
                                        id: 'Onslaught1',
                                        campaign: 'Onslaught',
                                        battleNumber: 1,
                                        raidsCount: 1,
                                        farmedItems: goal.shardsPerDayOrToken,
                                        energySpent: 0,
                                    }}
                                />
                                <RaidItem
                                    material={{
                                        materialId: character.name,
                                        materialLabel: character.name,
                                        materialRarity: character.rarity,
                                        totalCount: goalShards,
                                        materialIconPath: '',
                                        characterIconPath: character.icon,
                                        characters: [character.name],
                                        locations: [],
                                    }}
                                    location={{
                                        id: 'Onslaught2',
                                        campaign: 'Onslaught',
                                        battleNumber: 2,
                                        raidsCount: 1,
                                        farmedItems: goal.shardsPerDayOrToken,
                                        energySpent: 0,
                                    }}
                                />
                                <RaidItem
                                    material={{
                                        materialId: character.name,
                                        materialLabel: character.name,
                                        materialRarity: character.rarity,
                                        totalCount: goalShards,
                                        materialIconPath: '',
                                        characterIconPath: character.icon,
                                        characters: [character.name],
                                        locations: [],
                                    }}
                                    location={{
                                        id: 'Onslaught3',
                                        campaign: 'Onslaught',
                                        battleNumber: 3,
                                        raidsCount: 1,
                                        farmedItems: goal.shardsPerDayOrToken,
                                        energySpent: 0,
                                    }}
                                />
                            </>
                        ) : undefined}
                    </div>
                ) : undefined}
                <span>{goal.notes}</span>
            </CardContent>
        </Card>
    );
};

const RaidItem = ({ material, location }: { material: IMaterialRaid; location: IRaidLocation }) => {
    const { dailyRaids, campaignsProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [itemsObtained, setItemsObtained] = useState<string | number>(Math.round(location.farmedItems));

    const completedLocations = dailyRaids.completedLocations?.flatMap(x => x.locations) ?? [];

    const isLocationCompleted = useMemo(
        () => completedLocations.some(completedLocation => completedLocation.id === location.id),
        [completedLocations]
    );

    const isLocationUnlocked = useMemo(() => {
        if (location.campaign === 'Onslaught') {
            return true;
        }
        const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
        return location.battleNumber <= campaignProgress;
    }, []);

    const isDisabled = isLocationCompleted || !isLocationUnlocked;

    const handleItemsObtainedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setItemsObtained(event.target.value);
    };

    const handleAdd = (event: React.MouseEvent) => {
        event.stopPropagation();
        const value = itemsObtained === '' ? 0 : Number(itemsObtained);
        if (value > 0) {
            dispatch.characters({
                type: 'IncrementShards',
                character: material.materialId,
                value,
            });
            enqueueSnackbar(`Added ${value} shards for ${material.materialLabel}`, { variant: 'success' });
        }

        dispatch.dailyRaids({
            type: 'AddCompletedBattle',
            location: { ...location, energySpent: 0 },
            material: {
                ...material,
                locations: [],
            },
        });
    };

    return (
        <li
            style={{
                display: 'flex',
                gap: 5,
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: isDisabled ? 0.5 : 1,
            }}>
            <div
                style={{
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                }}>
                <CampaignImage campaign={location.campaign} size={30} />
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                    <span>
                        <span style={{ fontStyle: 'italic' }}>({location.raidsCount}x)</span> Battle{' '}
                        <span style={{ fontWeight: 'bold' }}>{location.battleNumber}</span>
                    </span>
                    <span style={{ fontSize: 12 }}>{location.campaign}</span>
                </div>
            </div>
            <div
                style={{
                    minWidth: 60,
                    maxWidth: 70,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                <FormControlLabel
                    control={
                        <Input
                            disabled={isDisabled}
                            value={itemsObtained}
                            size="small"
                            onChange={handleItemsObtainedChange}
                            inputProps={{
                                step: 1,
                                min: 0,
                                type: 'number',
                            }}
                        />
                    }
                    sx={{ margin: 0 }}
                    label={''}
                />
                <Tooltip title={isDisabled ? '' : "Update character's shards"}>
                    <span>
                        <Button size={'small'} onClick={handleAdd} disabled={isLocationCompleted}>
                            {isLocationUnlocked ? 'Add' : 'Unlock'}
                        </Button>
                    </span>
                </Tooltip>
            </div>
        </li>
    );
};

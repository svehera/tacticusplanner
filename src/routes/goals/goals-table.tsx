import {
    ArrowForward,
    DeleteForever,
    Edit,
    ArrowUpward,
    ArrowDownward,
    FilterListOff,
    Block,
    CheckCircle,
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { charsUnlockShards } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { StoreContext, DispatchContext } from 'src/reducers/store.provider';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon, StarsIcon, RankIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { AccessibleTooltip } from '@/fsd/5-shared/ui/tooltip';

import { CharacterAbilitiesTotal } from '@/fsd/3-features/characters/components/character-abilities-total';
import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import {
    CharacterRaidGoalSelect,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
} from '@/fsd/3-features/goals/goals.models';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { XpTooltip } from '@/fsd/3-features/goals/xp-tooltip';

import { MowMaterialsTotal } from '@/fsd/1-pages/learn-mow/mow-materials-total';

import { GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';

interface Props {
    rows: CharacterRaidGoalSelect[];
    estimate: IGoalEstimate[];
    goalsColorCoding: GoalColorMode;
    menuItemSelect: (goalId: string, item: 'edit' | 'delete') => void;
}

export const GoalsTable: React.FC<Props> = ({ rows, estimate, goalsColorCoding, menuItemSelect }) => {
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const getStatusIcons = (goalEstimate: IGoalEstimate) => {
        if (!goalEstimate.completed && !goalEstimate.blocked && !!goalEstimate.included) {
            return <div className="h-[0px]" />;
        }
        return (
            <div>
                {!!goalEstimate.completed && (
                    <AccessibleTooltip title={`Goal is completed in current estimation.`}>
                        <span className="flex-box gap-[3px]" tabIndex={0}>
                            <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                        </span>
                    </AccessibleTooltip>
                )}
                {!!goalEstimate.blocked && (
                    <AccessibleTooltip
                        title={`Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.`}>
                        <span className="flex-box gap-[3px]" tabIndex={0}>
                            <Block fontSize="small" sx={{ color: 'error.main' }} />
                        </span>
                    </AccessibleTooltip>
                )}
                {!goalEstimate.included && (
                    <AccessibleTooltip
                        title={`Goal is excluded from current estimation. Enable it using the goal filter in the Daily Raids page.`}>
                        <span className="flex-box gap-[3px]" tabIndex={0}>
                            <FilterListOff fontSize="small" sx={{ color: 'error.main' }} />
                        </span>
                    </AccessibleTooltip>
                )}
            </div>
        );
    };

    const getGoalInfo = (goal: CharacterRaidGoalSelect, goalEstimate: IGoalEstimate) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                const isSameRarity = goal.rarityStart === goal.rarityEnd;
                const minStars = RarityMapper.toStars[goal.rarityEnd];
                const isMinStars = minStars === goal.starsEnd;

                const targetShards = ShardsService.getTargetShards(goal);
                const targetMythicShards = ShardsService.getTargetMythicShards(goal);
                return (
                    <div>
                        <div className="flex-box between items-center">
                            <div className="flex-box column">
                                <div className="flex-box gap5">
                                    {!isSameRarity && (
                                        <>
                                            <RarityIcon rarity={goal.rarityStart} /> <ArrowForward />
                                            <RarityIcon rarity={goal.rarityEnd} />
                                            {!isMinStars && <StarsIcon stars={goal.starsEnd} />}
                                        </>
                                    )}

                                    {isSameRarity && (
                                        <>
                                            <StarsIcon stars={goal.starsStart} /> <ArrowForward />
                                            <StarsIcon stars={goal.starsEnd} />
                                        </>
                                    )}
                                </div>

                                <div>
                                    {targetShards > 0 && (
                                        <div>
                                            <b>
                                                {goal.shards} of {targetShards}
                                            </b>{' '}
                                            Shards
                                        </div>
                                    )}
                                    {targetMythicShards > 0 && (
                                        <div>
                                            <b>
                                                {goal.mythicShards} of {targetMythicShards}
                                            </b>{' '}
                                            Mythic Shards
                                        </div>
                                    )}
                                </div>
                            </div>
                            {getStatusIcons(goalEstimate)}
                        </div>
                        {goalEstimate.orbsEstimate &&
                            !!Object.values(goalEstimate.orbsEstimate.orbs).some(x => x > 0) && (
                                <div className="py-2.5">
                                    <OrbsTotal
                                        size={25}
                                        alliance={goalEstimate.orbsEstimate.alliance}
                                        orbs={goalEstimate.orbsEstimate.orbs}
                                        displayOrbs={Object.fromEntries(
                                            Object.entries(goalEstimate.orbsEstimate.orbs).filter(([, v]) => v > 0)
                                        )}
                                    />
                                </div>
                            )}
                    </div>
                );
            }

            case PersonalGoalType.UpgradeRank: {
                return (
                    <div>
                        <div className="flex-box between">
                            <div className="flex-box gap-[3px]">
                                <RankIcon rank={goal.rankStart} rankPoint5={goal.rankStartPoint5} /> <ArrowForward />
                                <RankIcon rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                                {!!goal.upgradesRarity.length && (
                                    <div className="flex-box gap-[3px]">
                                        {goal.upgradesRarity.map(x => (
                                            <RarityIcon key={x} rarity={x} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {getStatusIcons(goalEstimate)}
                        </div>
                        {goalEstimate.xpBooksApplied !== undefined &&
                            goalEstimate.xpBooksRequired !== undefined &&
                            goalEstimate.xpBooksRequired > 0 && (
                                <>
                                    <div className="flex flex-row">
                                        <div className="mr-0.5">
                                            XP Books Applied {goalEstimate.xpBooksApplied} / Required{' '}
                                            {goalEstimate.xpBooksRequired} (
                                            {Math.round(
                                                (goalEstimate.xpBooksApplied / goalEstimate.xpBooksRequired!) * 100
                                            )}
                                            %)
                                        </div>
                                        {goalEstimate.xpEstimate && <XpTooltip {...goalEstimate.xpEstimate} />}
                                    </div>
                                </>
                            )}
                    </div>
                );
            }
            case PersonalGoalType.MowAbilities: {
                const hasPrimaryGoal = goal.primaryEnd > goal.primaryStart;
                const hasSecondaryGoal = goal.secondaryEnd > goal.secondaryStart;
                return (
                    <div>
                        <div className="flex-box between gap10">
                            <div className="flex-box column start">
                                {hasPrimaryGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Primary:</span> <b>{goal.primaryStart}</b> <ArrowForward />
                                        <b>{goal.primaryEnd}</b>
                                    </div>
                                )}

                                {hasSecondaryGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Secondary:</span> <b>{goal.secondaryStart}</b> <ArrowForward />
                                        <b>{goal.secondaryEnd}</b>
                                    </div>
                                )}
                            </div>
                            {!!goal.upgradesRarity.length && (
                                <div className="flex-box gap-[3px]">
                                    {goal.upgradesRarity.map(x => (
                                        <RarityIcon key={x} rarity={x} />
                                    ))}
                                </div>
                            )}
                            {getStatusIcons(goalEstimate)}
                        </div>
                        {goalEstimate.mowEstimate && (
                            <div className="px-0 py-2.5">
                                <MowMaterialsTotal
                                    size="small"
                                    mowAlliance={goal.unitAlliance}
                                    total={goalEstimate.mowEstimate}
                                />
                            </div>
                        )}
                    </div>
                );
            }
            case PersonalGoalType.CharacterAbilities: {
                const hasActiveGoal = goal.activeEnd > goal.activeStart;
                const hasPassiveGoal = goal.passiveEnd > goal.passiveStart;
                return (
                    <div>
                        <div className="flex-box gap10">
                            <div className="flex-box column start">
                                {hasActiveGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Active:</span> <b>{goal.activeStart}</b> <ArrowForward />
                                        <b>{goal.activeEnd}</b>
                                    </div>
                                )}

                                {hasPassiveGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Passive:</span> <b>{goal.passiveStart}</b> <ArrowForward />
                                        <b>{goal.passiveEnd}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                        {goalEstimate.xpBooksApplied !== undefined &&
                            goalEstimate.xpBooksRequired !== undefined &&
                            goalEstimate.xpBooksRequired > 0 && (
                                <div>
                                    XP Books Applied {goalEstimate.xpBooksApplied} / Required{' '}
                                    {goalEstimate.xpBooksRequired} (
                                    {Math.round((goalEstimate.xpBooksApplied / goalEstimate.xpBooksRequired!) * 100)}
                                    %)
                                </div>
                            )}
                        {goalEstimate.abilitiesEstimate && (
                            <div className="px-0 py-2.5">
                                <CharacterAbilitiesTotal {...goalEstimate.abilitiesEstimate} />
                            </div>
                        )}
                    </div>
                );
            }
            case PersonalGoalType.Unlock: {
                const targetShards = charsUnlockShards[goal.rarity];

                return (
                    <div>
                        <div className="flex-box between">
                            <div>
                                <b>
                                    {goal.shards} of {targetShards}
                                </b>{' '}
                                Shards
                            </div>
                            {getStatusIcons(goalEstimate)}
                        </div>
                    </div>
                );
            }
        }
    };

    const columnDefs = useMemo<Array<ColDef<CharacterRaidGoalSelect>>>(() => {
        return [
            {
                field: 'priority',
                maxWidth: 100,
                cellRenderer: (params: ICellRendererParams<CharacterRaidGoalSelect>) => {
                    const { data } = params;
                    if (!data) return;

                    const moveUp = () => {
                        if (data.priority <= 1) return;
                        const updated = { ...data, priority: data.priority - 1 } as CharacterRaidGoalSelect;
                        dispatch.goals({ type: 'Update', goal: updated });
                    };

                    const moveDown = () => {
                        if (data.priority >= rows.length) return;
                        const updated = { ...data, priority: data.priority + 1 } as CharacterRaidGoalSelect;
                        dispatch.goals({ type: 'Update', goal: updated });
                    };

                    return (
                        <div className="flex-box column center">
                            <div className="flex-box gap5 items-center">
                                <div>{data.priority}</div>
                                <IconButton size="small" onClick={moveUp}>
                                    <ArrowUpward fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={moveDown}>
                                    <ArrowDownward fontSize="small" />
                                </IconButton>
                            </div>
                        </div>
                    );
                },
            },
            {
                headerName: 'Actions',
                cellRenderer: (params: ICellRendererParams<CharacterRaidGoalSelect>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <>
                                <IconButton onClick={() => menuItemSelect(data.goalId, 'edit')}>
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton onClick={() => menuItemSelect(data.goalId, 'delete')}>
                                    <DeleteForever fontSize="small" />
                                </IconButton>
                            </>
                        );
                    }
                },
                maxWidth: 90,
            },
            {
                field: 'unitIcon',
                headerName: 'Character',
                cellRenderer: (params: ICellRendererParams<CharacterRaidGoalSelect>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <UnitShardIcon icon={data.unitRoundIcon} height={30} width={30} tooltip={data.unitName} />
                        );
                    }
                },
                sortable: false,
                maxWidth: 90,
            },
            {
                headerName: 'Details',
                autoHeight: true,
                width: 300,
                cellRenderer: (params: ICellRendererParams<CharacterRaidGoalSelect>) => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (data && goalEstimate) {
                        return getGoalInfo(data, goalEstimate);
                    }
                },
            },
            {
                headerName: 'Estimated date',
                hide: rows.every(row => row.type === PersonalGoalType.CharacterAbilities),
                valueGetter: params => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (goalEstimate) {
                        if (!goalEstimate.daysLeft) {
                            return '';
                        }

                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + goalEstimate.daysLeft - 1);
                        let ret = formatDateWithOrdinal(nextDate);
                        if (goalEstimate.xpDaysLeft !== undefined) {
                            ret +=
                                '\n' +
                                '(XP by ' +
                                formatDateWithOrdinal(
                                    new Date(new Date().getTime() + goalEstimate.xpDaysLeft * 86400000)
                                ) +
                                ')';
                        }

                        return ret;
                    }
                },
            },
            {
                headerName: 'Days left',
                hide: rows.every(row => row.type === PersonalGoalType.CharacterAbilities),
                valueGetter: params => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (goalEstimate) {
                        return goalEstimate.daysLeft;
                    }
                },
                maxWidth: 110,
            },
            {
                headerName: 'Days total',
                hide: rows.every(row => row.type === PersonalGoalType.CharacterAbilities),
                valueGetter: params => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (goalEstimate) {
                        return goalEstimate.daysTotal;
                    }
                },
                maxWidth: 110,
            },
            {
                headerName: 'Energy',
                hide: rows.every(row => row.type === PersonalGoalType.CharacterAbilities),
                valueGetter: params => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (goalEstimate) {
                        return goalEstimate.energyTotal;
                    }
                },
                maxWidth: 110,
            },
            {
                headerName: 'Onslaught tokens',
                hide: !rows.some(row => row.type === PersonalGoalType.Ascend),
                valueGetter: params => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (goalEstimate) {
                        return goalEstimate.oTokensTotal;
                    }
                },
                maxWidth: 140,
            },
            {
                headerName: 'Upgrades',
                hide: !rows.some(row =>
                    [PersonalGoalType.UpgradeRank, PersonalGoalType.MowAbilities].includes(row.type)
                ),
                cellRenderer: (params: ICellRendererParams<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>) => {
                    const { data } = params;
                    if (data) {
                        let linkBase: string = '';
                        let params: string = '';

                        if (data.type === PersonalGoalType.UpgradeRank) {
                            linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
                            params = `?charSnowprintId=${data.unitId}`;
                        }

                        if (data.type === PersonalGoalType.MowAbilities) {
                            linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
                            params = `?charSnowprintId=${data.unitId}`;
                        }
                        return (
                            <Button
                                size="small"
                                variant={'outlined'}
                                component={Link}
                                to={linkBase + params}
                                target={'_self'}>
                                <LinkIcon /> <span className="pl-[5px]">Go to Raids Table</span>
                            </Button>
                        );
                    }
                },
                // width: 120,
            },
            {
                field: 'notes',
                // width: 120,
            },
        ];
    }, [rows]);

    const getRowStyle = useMemo(
        () => (params: any) => {
            return {
                background: GoalService.getBackgroundColor(
                    goalsColorCoding,
                    estimate.find(x => x.goalId === params.data?.goalId)
                ),
            };
        },
        [estimate, goalsColorCoding, viewPreferences]
    );

    const baseRowHeight = !rows.some(row => [PersonalGoalType.CharacterAbilities].includes(row.type)) ? 60 : 90;

    return (
        <div
            className="ag-theme-material min-h-[150px] w-full"
            style={{
                height: baseRowHeight + rows.length * baseRowHeight,
            }}>
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                defaultColDef={{
                    suppressMovable: true,
                    sortable: true,
                    wrapText: true,
                }}
                rowHeight={60}
                columnDefs={columnDefs}
                rowData={rows}
                getRowStyle={getRowStyle}
            />
        </div>
    );
};

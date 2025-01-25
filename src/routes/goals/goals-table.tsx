import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { PersonalGoalType, Rank } from 'src/models/enums';
import {
    CharacterRaidGoalSelect,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
} from 'src/v2/features/goals/goals.models';
import { CharacterImage } from 'src/shared-components/character-image';
import { charsUnlockShards, rarityToStars } from 'src/models/constants';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { ArrowForward, DeleteForever, Edit, Info } from '@mui/icons-material';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { RankImage } from 'src/v2/components/images/rank-image';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import LinkIcon from '@mui/icons-material/Link';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import IconButton from '@mui/material/IconButton';
import { MowMaterialsTotal } from 'src/v2/features/lookup/mow-materials-total';
import { XpTotal } from 'src/v2/features/goals/xp-total';
import { CharacterAbilitiesTotal } from 'src/v2/features/characters/components/character-abilities-total';

interface Props {
    rows: CharacterRaidGoalSelect[];
    estimate: IGoalEstimate[];
    menuItemSelect: (goalId: string, item: 'edit' | 'delete') => void;
}

export const GoalsTable: React.FC<Props> = ({ rows, estimate, menuItemSelect }) => {
    const getGoalInfo = (goal: CharacterRaidGoalSelect, goalEstimate: IGoalEstimate) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                const isSameRarity = goal.rarityStart === goal.rarityEnd;
                const minStars = rarityToStars[goal.rarityEnd];
                const isMinStars = minStars === goal.starsEnd;

                const targetShards = ShardsService.getTargetShards(goal);
                return (
                    <div>
                        <div className="flex-box between">
                            <div className="flex-box gap5">
                                {!isSameRarity && (
                                    <>
                                        <RarityImage rarity={goal.rarityStart} /> <ArrowForward />
                                        <RarityImage rarity={goal.rarityEnd} />
                                        {!isMinStars && <StarsImage stars={goal.starsEnd} />}
                                    </>
                                )}

                                {isSameRarity && (
                                    <>
                                        <StarsImage stars={goal.starsStart} /> <ArrowForward />
                                        <StarsImage stars={goal.starsEnd} />
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <b>
                                {goal.shards} of {targetShards}
                            </b>{' '}
                            Shards
                        </div>
                    </div>
                );
            }
            case PersonalGoalType.UpgradeRank: {
                const { xpEstimate } = goalEstimate;
                return (
                    <div>
                        <div className="flex-box between">
                            <div className="flex-box gap3">
                                <RankImage rank={goal.rankStart} /> <ArrowForward />
                                <RankImage rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                                {!!goal.upgradesRarity.length && (
                                    <div className="flex-box gap3">
                                        {goal.upgradesRarity.map(x => (
                                            <RarityImage key={x} rarity={x} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {xpEstimate && <XpTotal {...xpEstimate} />}
                    </div>
                );
            }
            case PersonalGoalType.MowAbilities: {
                const hasPrimaryGoal = goal.primaryEnd > goal.primaryStart;
                const hasSecondaryGoal = goal.secondaryEnd > goal.secondaryStart;
                return (
                    <div>
                        <div className="flex-box gap10">
                            <div className="flex-box column start">
                                {hasPrimaryGoal && (
                                    <div className="flex-box gap3">
                                        <span>Primary:</span> <b>{goal.primaryStart}</b> <ArrowForward />
                                        <b>{goal.primaryEnd}</b>
                                    </div>
                                )}

                                {hasSecondaryGoal && (
                                    <div className="flex-box gap3">
                                        <span>Secondary:</span> <b>{goal.secondaryStart}</b> <ArrowForward />
                                        <b>{goal.secondaryEnd}</b>
                                    </div>
                                )}
                            </div>
                            {!!goal.upgradesRarity.length && (
                                <div className="flex-box gap3">
                                    {goal.upgradesRarity.map(x => (
                                        <RarityImage key={x} rarity={x} />
                                    ))}
                                </div>
                            )}
                        </div>
                        {goalEstimate.mowEstimate && (
                            <div style={{ padding: '10px 0' }}>
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
                                    <div className="flex-box gap3">
                                        <span>Active:</span> <b>{goal.activeStart}</b> <ArrowForward />
                                        <b>{goal.activeEnd}</b>
                                    </div>
                                )}

                                {hasPassiveGoal && (
                                    <div className="flex-box gap3">
                                        <span>Passive:</span> <b>{goal.passiveStart}</b> <ArrowForward />
                                        <b>{goal.passiveEnd}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                        {goalEstimate.xpEstimateAbilities && <XpTotal {...goalEstimate.xpEstimateAbilities} />}
                        {goalEstimate.abilitiesEstimate && (
                            <div style={{ padding: '10px 0' }}>
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
                maxWidth: 70,
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
                maxWidth: 110,
            },
            {
                field: 'unitIcon',
                headerName: 'Character',
                cellRenderer: (params: ICellRendererParams<CharacterRaidGoalSelect>) => {
                    const { data } = params;
                    if (data) {
                        return <CharacterImage icon={data.unitIcon} height={30} width={30} tooltip={data.unitName} />;
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

                        return formatDateWithOrdinal(nextDate);
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
                            linkBase = isMobile ? '/mobile/learn/rankLookup' : '/learn/rankLookup';
                            params = `?character=${data.unitName}&rankStart=${Rank[data.rankStart]}&rankEnd=${
                                Rank[data.rankEnd]
                            }&rankPoint5=${data.rankPoint5}`;
                        }

                        if (data.type === PersonalGoalType.MowAbilities) {
                            linkBase = isMobile ? '/mobile/learn/mowLookup' : '/learn/mowLookup';
                            params = `?mow=${data.unitId}&pStart=${data.primaryStart}&pEnd=${data.primaryEnd}&sStart=${data.secondaryStart}&sEnd=${data.secondaryEnd}`;
                        }
                        return (
                            <Button
                                size="small"
                                variant={'outlined'}
                                component={Link}
                                to={linkBase + params}
                                target={'_self'}>
                                <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Lookup</span>
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

    const baseRowHeight = !rows.some(row => [PersonalGoalType.CharacterAbilities].includes(row.type)) ? 60 : 90;

    return (
        <div
            className="ag-theme-material"
            style={{
                height: baseRowHeight + rows.length * baseRowHeight,
                minHeight: 150,
                width: '100%',
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
            />
        </div>
    );
};

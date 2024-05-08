import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { PersonalGoalType, Rank } from 'src/models/enums';
import { CharacterRaidGoalSelect, ICharacterUpgradeRankGoal, IGoalEstimate } from 'src/v2/features/goals/goals.models';
import { CharacterImage } from 'src/shared-components/character-image';
import { charsUnlockShards, rankToLevel, rarityToStars } from 'src/models/constants';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { ArrowForward, DeleteForever, Edit, Info } from '@mui/icons-material';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { RankImage } from 'src/v2/components/images/rank-image';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import LinkIcon from '@mui/icons-material/Link';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import IconButton from '@mui/material/IconButton';

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
                        {xpEstimate && (
                            <div className="flex-box gap5">
                                <span>(XP) Codex of War: {xpEstimate.legendaryBooks}</span>
                                <AccessibleTooltip
                                    title={
                                        <span>
                                            Current level: {xpEstimate.currentLevel}
                                            <br />
                                            Target level: {xpEstimate.targetLevel}
                                            <br />
                                            Gold: {xpEstimate.gold}
                                            <br />
                                            XP left: {xpEstimate.xpLeft}
                                        </span>
                                    }>
                                    <Info color="primary" />
                                </AccessibleTooltip>
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
                field: 'characterIcon',
                headerName: 'Character',
                cellRenderer: (params: ICellRendererParams<CharacterRaidGoalSelect>) => {
                    const { data } = params;
                    if (data) {
                        return <CharacterImage icon={data.characterIcon} imageSize={30} tooltip={data.characterName} />;
                    }
                },
                sortable: false,
                maxWidth: 90,
            },
            {
                headerName: 'Details',
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
                valueGetter: params => {
                    const { data } = params;
                    const goalEstimate = estimate.find(x => x.goalId === data?.goalId);
                    if (goalEstimate) {
                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + goalEstimate.daysLeft - 1);

                        return formatDateWithOrdinal(nextDate);
                    }
                },
            },
            {
                headerName: 'Days',
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
                headerName: 'Energy',
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
                hide: !rows.some(row => row.type === PersonalGoalType.UpgradeRank),
                cellRenderer: (params: ICellRendererParams<ICharacterUpgradeRankGoal>) => {
                    const { data } = params;
                    if (data) {
                        const linkBase = isMobile ? '/mobile/learn/rankLookup' : '/learn/rankLookup';
                        const params = `?character=${data.characterName}&rankStart=${Rank[data.rankStart]}&rankEnd=${
                            Rank[data.rankEnd]
                        }&rankPoint5=${data.rankPoint5}`;
                        return (
                            <Button
                                size="small"
                                variant={'outlined'}
                                component={Link}
                                to={linkBase + params}
                                target={isMobile ? '_self' : '_blank'}>
                                <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Upgrades</span>
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

    return (
        <div
            className="ag-theme-material"
            style={{
                height: 50 + rows.length * 60,
                minHeight: 150,
                maxHeight: 500,
                width: '100%',
            }}>
            <AgGridReact
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

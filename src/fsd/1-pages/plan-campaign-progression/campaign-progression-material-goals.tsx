import { ArrowForward } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AllCommunityModule, themeBalham, ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

import { RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation, CampaignType, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { BattleSavings, CampaignData, CampaignsProgressData } from './campaign-progression.models';
import { CampaignsProgressionService } from './campaign-progression.service';
interface Props {
    campaignData: CampaignData;
    progression: CampaignsProgressData;
}

export const CampaignProgressionMaterialGoals: React.FC<Props> = ({ campaignData, progression }) => {
    const [colDefs] = useState(getColumnDefs());
    const [mobileColDefs] = useState(getMobileColumnDefs());

    /**
     * Returns the unit ID of each character that has a goal requiring at least
     * one instance of `material`.
     */
    function getCharactersNeedingMaterial(material: string): string[] {
        return Array.from(progression.charactersNeedingMaterials.get(material) ?? []);
    }

    /** @returns the quantity of this upgrade material that our goals require. */
    function getRequiredMaterialCount(material: string): number {
        return progression.materialFarmData.get(material)?.count ?? 0;
    }

    function campaignTypeToNumber(type: CampaignType): number {
        switch (type) {
            case CampaignType.Elite:
                return 0;
            case CampaignType.Early:
                return 1;
            case CampaignType.Mirror:
                return 2;
            case CampaignType.Normal:
                return 3;
            default:
                return 4;
        }
    }

    /** @returns true iff typeA is more cost-efficient at farming than typeB.  */
    function isCampaignTypeMoreEfficient(typeA: CampaignType, typeB: CampaignType): boolean {
        return campaignTypeToNumber(typeA) < campaignTypeToNumber(typeB);
    }

    /**
     * @param material The material to farm.
     * @returns The battle representing the best node to farm (picked
     *          arbitrarily if there's a tie) currently farmable for the
     *          material.
     */
    function getCheapestNode(material: string): ICampaignBattleComposed | undefined {
        let result: ICampaignBattleComposed | undefined = undefined;
        for (const loc of progression.materialFarmData.get(material)?.farmableLocations ?? []) {
            if (!result || isCampaignTypeMoreEfficient(loc.campaignType, result.campaignType)) {
                result = loc;
            }
        }
        return result;
    }

    /**
     * @returns the tooltip text to display that gives human-readable language
     *          describing how the savings were computed.
     */
    function getSavingsTooltipText(material: string): string {
        const node = getCheapestNode(material);
        if (!node) return '(unfarmable)';
        return (
            UpgradesService.getUpgrade(material).label +
            ' is currently farmable from ' +
            node.id +
            '. You need ' +
            getRequiredMaterialCount(material) +
            ' to complete your goals, which costs ' +
            CampaignsProgressionService.getCostToFarmMaterial(
                node.campaignType,
                getRequiredMaterialCount(material),
                node.rarityEnum
            ) +
            ' energy, before beating this node.'
        );
    }

    /**
     * @returns the mobile column defs for the grid that holds the material
     * requirements related to the campaign.
     */
    function getMobileColumnDefs(): ColDef[] {
        return [
            {
                headerName: 'Battle',
                autoHeight: true,
                width: 70,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    return (
                        <CampaignLocation
                            key={savings.battle.id}
                            location={savings.battle}
                            short={true}
                            unlocked={true}
                        />
                    );
                },
            },
            {
                headerName: 'Mat.',
                autoHeight: true,
                width: 45,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    const reward = UpgradesService.getUpgradeMaterial(
                        CampaignsProgressionService.getReward(savings.battle)
                    );
                    if (reward && reward.stat === 'Shard') {
                        const char = CharactersService.getUnit(reward.material);
                        if (char)
                            return (
                                <UnitShardIcon
                                    name={reward.material}
                                    icon={char.roundIcon}
                                    height={30}
                                    width={30}
                                    tooltip={`${reward.material} shards`}
                                />
                            );
                    } else if (reward) {
                        return (
                            <UpgradeImage
                                material={CampaignsProgressionService.getReward(savings.battle)}
                                iconPath={reward?.icon ?? ''}
                                rarity={RarityMapper.stringToRarityString(reward.rarity)}
                                size={30}
                            />
                        );
                    }
                    return <div></div>;
                },
            },
            {
                headerName: '#',
                autoHeight: true,
                flex: 1,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    return (
                        <span>{getRequiredMaterialCount(CampaignsProgressionService.getReward(savings.battle))}x</span>
                    );
                },
            },
            {
                headerName: 'Savings',
                autoHeight: true,
                flex: 2,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (!savings.canFarmPrior) {
                        let tooltipText: string = '';
                        const battle = CampaignsProgressionService.getBattleFromBaseCampaignWithSameReward(
                            savings.battle,
                            progression.materialFarmData.get(CampaignsProgressionService.getReward(savings.battle))
                        );
                        if (battle != undefined) {
                            tooltipText =
                                'Currently unfarmable, but will be unlocked in ' +
                                battle.id +
                                ' before reaching this battle.';
                        }
                        return (
                            <Tooltip title={tooltipText}>
                                <span>Unlocks{battle === undefined ? '' : '*'}</span>
                            </Tooltip>
                        );
                    } else {
                        return (
                            <Tooltip
                                title={getSavingsTooltipText(CampaignsProgressionService.getReward(savings.battle))}>
                                <span>
                                    {savings.savings} <MiscIcon icon={'energy'} height={15} width={15} />
                                </span>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                headerName: 'Cum. Savings',
                autoHeight: true,
                flex: 2,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (savings.canFarmPrior) {
                        return (
                            <span>
                                {savings.cumulativeSavings} <MiscIcon icon={'energy'} height={15} width={15} />
                            </span>
                        );
                    }
                },
            },
        ];
    }

    /**
     * @returns the column defs for the grid that holds the material
     * requirements related to the campaign.
     */
    function getColumnDefs(): ColDef[] {
        return [
            {
                headerName: 'A',
                autoHeight: true,
                width: 70,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    return (
                        <CampaignLocation
                            key={savings.battle.id}
                            location={savings.battle}
                            short={true}
                            unlocked={true}
                        />
                    );
                },
            },
            {
                headerName: 'B',
                autoHeight: true,
                width: 35,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    return <ArrowForward />;
                },
            },
            {
                headerName: 'C',
                autoHeight: true,
                width: 45,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    const reward = UpgradesService.getUpgradeMaterial(
                        CampaignsProgressionService.getReward(savings.battle)
                    );
                    if (reward && reward.stat === 'Shard') {
                        const char = CharactersService.getUnit(reward.material);
                        if (char)
                            return (
                                <UnitShardIcon
                                    name={reward.material}
                                    icon={char.roundIcon}
                                    height={30}
                                    width={30}
                                    tooltip={`${reward.material} shards`}
                                />
                            );
                    } else if (reward) {
                        return (
                            <UpgradeImage
                                material={CampaignsProgressionService.getReward(savings.battle)}
                                iconPath={reward?.icon ?? ''}
                                rarity={RarityMapper.stringToRarityString(reward.rarity)}
                                size={30}
                            />
                        );
                    }
                    return <div></div>;
                },
            },
            {
                headerName: 'D',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    return (
                        <span>
                            Goals require{' '}
                            {getRequiredMaterialCount(CampaignsProgressionService.getReward(savings.battle))}x
                        </span>
                    );
                },
            },
            {
                headerName: 'E',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (!savings.canFarmPrior) {
                        let tooltipText: string = '';
                        const battle = CampaignsProgressionService.getBattleFromBaseCampaignWithSameReward(
                            savings.battle,
                            progression.materialFarmData.get(CampaignsProgressionService.getReward(savings.battle))
                        );
                        if (battle != undefined) {
                            tooltipText =
                                'Currently unfarmable, but will be unlocked in ' +
                                battle.id +
                                ' before reaching this battle.';
                        }
                        return (
                            <Tooltip title={tooltipText}>
                                <span>Unlocks the material{battle === undefined ? '' : '*'}</span>
                            </Tooltip>
                        );
                    } else {
                        return (
                            <Tooltip
                                title={getSavingsTooltipText(CampaignsProgressionService.getReward(savings.battle))}>
                                <span>
                                    Saves {savings.savings} <MiscIcon icon={'energy'} height={15} width={15} />
                                </span>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                headerName: 'F',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (savings.canFarmPrior) {
                        return (
                            <span>
                                Cumulative {savings.cumulativeSavings}{' '}
                                <MiscIcon icon={'energy'} height={15} width={15} />
                            </span>
                        );
                    }
                },
            },
            {
                headerName: 'G',
                autoHeight: true,
                cellStyle: { width: '100%' },
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    const characters = getCharactersNeedingMaterial(
                        CampaignsProgressionService.getReward(savings.battle)
                    );
                    if (characters.length == 0) return <span></span>;
                    return (
                        <div className="flex-box gap5 wrap" key={CampaignsProgressionService.getReward(savings.battle)}>
                            {characters.map((unitId, ignoredIndex) => {
                                return (
                                    <span
                                        key={
                                            unitId +
                                            '-' +
                                            CampaignsProgressionService.getReward(savings.battle) +
                                            '-' +
                                            savings.battle.id
                                        }>
                                        <UnitShardIcon
                                            icon={CharactersService.getUnit(unitId)?.roundIcon ?? '(undefined)'}
                                            height={30}
                                            width={30}
                                            tooltip={CharactersService.getUnit(unitId)?.name}
                                        />
                                    </span>
                                );
                            })}
                        </div>
                    );
                },
            },
        ];
    }

    /**
     * @returns the row data for the grid that holds the material
     * requirements related to the campaign.
     */
    function getRowData(): any[] {
        const rowData: any[] = [];
        for (const savings of campaignData[1].savings) {
            rowData.push({ savingsData: [{ savings: savings }] });
        }
        return rowData;
    }

    return (
        <AgGridReact
            modules={[AllCommunityModule]}
            theme={themeBalham}
            columnDefs={isMobile ? mobileColDefs : colDefs}
            rowData={getRowData()}
            domLayout="autoHeight"
            headerHeight={isMobile ? 20 : 0}
            rowHeight={32}
        />
    );
};

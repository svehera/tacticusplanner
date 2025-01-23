import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { CampaignType } from 'src/models/enums';

import {
    BattleSavings,
    CampaignData,
    CampaignsProgressData,
} from 'src/v2/features/campaign-progression/campaign-progression.models';
import { ICampaignBattleComposed } from 'src/models/interfaces';

import { CampaignsProgressionService } from 'src/v2/features/campaign-progression/campaign-progression.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { StaticDataService } from 'src/services/static-data.service';

import { ArrowForward } from '@mui/icons-material';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { CharacterImage } from 'src/shared-components/character-image';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { Tooltip } from '@mui/material';

interface Props {
    campaignData: CampaignData;
    progression: CampaignsProgressData;
}

export const CampaignProgressionMaterialGoals: React.FC<Props> = ({ campaignData, progression }) => {
    const [colDefs] = useState(getColumnDefs());

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
            material +
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
                width: 35,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    if (UpgradesService.getUpgradeMaterial(savings.battle.reward)) {
                        return (
                            <UpgradeImage
                                material={savings.battle.reward}
                                iconPath={UpgradesService.getUpgradeMaterial(savings.battle.reward)?.icon ?? ''}
                                rarity={savings.battle.rarityEnum}
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
                    return <span>Goals require {getRequiredMaterialCount(savings.battle.reward)}x</span>;
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
                            progression.materialFarmData.get(savings.battle.reward)
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
                            <Tooltip title={getSavingsTooltipText(savings.battle.reward)}>
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
                    const characters = getCharactersNeedingMaterial(savings.battle.reward);
                    if (characters.length == 0) return <span></span>;
                    return characters.map((unitId, ignoredIndex) => {
                        return (
                            <span key={savings.battle.id + '-' + savings.battle.reward + '-' + unitId}>
                                <CharacterImage
                                    icon={StaticDataService.getUnit(unitId)?.icon ?? '(undefined)'}
                                    height={30}
                                    tooltip={StaticDataService.getUnit(unitId)?.icon}
                                />
                            </span>
                        );
                    });
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
            columnDefs={colDefs}
            rowData={getRowData()}
            domLayout="autoHeight"
            headerHeight={0}
            rowHeight={32}
        />
    );
};

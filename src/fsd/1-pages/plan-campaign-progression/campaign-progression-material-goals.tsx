import { ArrowForward } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { MaterialIcon } from './campaign-progression-material-icon';
import { BattleSavings, CampaignData, CampaignsProgressData } from './campaign-progression.models';
import { CampaignsProgressionService } from './campaign-progression.service';

interface Props {
    campaignData: CampaignData;
    progression: CampaignsProgressData;
}

/** Returns a tooltip explaining that a material will be unlocked before reaching this battle. */
function getUnlockTooltip(earlierUnlockBattle?: ICampaignBattleComposed): string {
    return earlierUnlockBattle
        ? 'Currently unfarmable, but will be unlocked in ' + earlierUnlockBattle.id + ' before reaching this battle.'
        : '';
}

/** Returns a human-readable label for a material ID, resolving shard/mythic-shard prefixes to character names. */
function getMaterialLabel(material: string): string {
    if (material.startsWith('shards_')) {
        const char = CharactersService.getUnit(material.slice('shards_'.length));
        return char ? `${char.name} shards` : material;
    }
    if (material.startsWith('mythicShards_')) {
        const char = CharactersService.getUnit(material.slice('mythicShards_'.length));
        return char ? `${char.name} mythic shards` : material;
    }
    return UpgradesService.getUpgrade(material)?.label ?? '(unknown material)';
}

/** Renders the materials savings table for a single campaign card. */
export const CampaignProgressionMaterialGoals: React.FC<Props> = ({ campaignData, progression }) => {
    function getRequiredMaterialCount(material: string): number {
        return progression.materialFarmData.get(material)?.count ?? 0;
    }

    function getCheapestNode(material: string): ICampaignBattleComposed | undefined {
        const count = getRequiredMaterialCount(material);
        const farmable = progression.materialFarmData.get(material)?.farmableLocations ?? [];
        let best: { node: ICampaignBattleComposed; cost: number } | undefined;
        for (const location of farmable) {
            const cost = CampaignsProgressionService.getCostToFarmMaterial(location, count);
            if (!best || cost < best.cost) best = { node: location, cost };
        }
        return best?.node;
    }

    function getSavingsTooltipText(material: string): string {
        const node = getCheapestNode(material);
        if (!node) return '(unfarmable)';
        return (
            getMaterialLabel(material) +
            ' is currently farmable from ' +
            node.id +
            '. You need ' +
            getRequiredMaterialCount(material) +
            ' to complete your goals, which costs ' +
            CampaignsProgressionService.getCostToFarmMaterial(node, getRequiredMaterialCount(material)) +
            ' energy, before beating this node.'
        );
    }

    function renderSavingsCell(
        savings: BattleSavings,
        material: string,
        earlierUnlockBattle?: ICampaignBattleComposed
    ) {
        if (savings.canFarmPrior) {
            return (
                <Tooltip title={getSavingsTooltipText(material)}>
                    <span className="font-mono font-semibold text-blue-600 tabular-nums dark:text-blue-400">
                        Saves {savings.savings} <MiscIcon icon={'energy'} height={15} width={15} />
                    </span>
                </Tooltip>
            );
        }
        return (
            <Tooltip title={getUnlockTooltip(earlierUnlockBattle)}>
                <span className="text-amber-600 dark:text-amber-400">
                    Unlocks{isMobile ? '' : ' the material'}
                    {earlierUnlockBattle ? '*' : ''}
                </span>
            </Tooltip>
        );
    }

    function renderCumulativeCell(savings: BattleSavings) {
        if (!savings.canFarmPrior) return;
        return (
            <span className="font-mono text-blue-600 tabular-nums dark:text-blue-400">
                {savings.cumulativeSavings} <MiscIcon icon={'energy'} height={15} width={15} />
            </span>
        );
    }

    const savingsRows = campaignData[1].savings;
    if (savingsRows.length === 0) return;

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
                <thead>
                    <tr>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            Node
                        </th>
                        <th className="border-b border-(--border) px-1 py-1.5" />
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            {isMobile ? 'Mat.' : 'Material / Shard'}
                        </th>
                        {!isMobile && (
                            <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                                Qty
                            </th>
                        )}
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            Savings
                        </th>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            {isMobile ? 'Total' : 'Cumulative'}
                        </th>
                        {!isMobile && (
                            <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                                Needed By
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {savingsRows.map(savings => {
                        const material = CampaignsProgressionService.getReward(savings.battle);
                        const earlierUnlockBattle = CampaignsProgressionService.getBattleFromBaseCampaignWithSameReward(
                            savings.battle,
                            progression.materialFarmData.get(material)
                        );
                        const characters = [...(progression.charactersNeedingMaterials.get(material) ?? [])];
                        return (
                            <tr key={savings.battle.id} className="border-b border-(--border)/50">
                                <td className="px-2 py-1.5 align-middle">
                                    <CampaignLocation location={savings.battle} short={true} unlocked={true} />
                                </td>
                                <td className="px-1 py-1.5 align-middle">
                                    <ArrowForward sx={{ fontSize: 16 }} className="text-(--muted-fg)" />
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    <div className="flex items-center gap-1.5">
                                        <MaterialIcon material={material} size={24} />
                                        <span className="text-xs">{getMaterialLabel(material)}</span>
                                    </div>
                                </td>
                                {!isMobile && (
                                    <td className="px-2 py-1.5 align-middle font-mono tabular-nums">
                                        {getRequiredMaterialCount(material)}x
                                    </td>
                                )}
                                <td className="px-2 py-1.5 align-middle">
                                    {renderSavingsCell(savings, material, earlierUnlockBattle)}
                                </td>
                                <td className="px-2 py-1.5 align-middle">{renderCumulativeCell(savings)}</td>
                                {!isMobile && (
                                    <td className="px-2 py-1.5 align-middle">
                                        {characters.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {characters.map(unitId => (
                                                    <UnitShardIcon
                                                        key={unitId + '-' + material}
                                                        icon={
                                                            CharactersService.getUnit(unitId)?.roundIcon ??
                                                            '(undefined)'
                                                        }
                                                        height={26}
                                                        width={26}
                                                        tooltip={CharactersService.getUnit(unitId)?.name}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { MaterialIcon } from './campaign-progression-material-icon';
import { CampaignData, CampaignsProgressData } from './campaign-progression.models';
import { CampaignsProgressionService } from './campaign-progression.service';

interface Props {
    progression: CampaignsProgressData;
    campaignDataArray: CampaignData[];
    inventoryUpgrades: Record<string, number>;
}

/** Collapsible panel listing all materials that are not yet farmable (no cleared battle drops them). */
export const CampaignProgressionUnfarmableMaterials: React.FC<Props> = ({
    progression,
    campaignDataArray,
    inventoryUpgrades,
}) => {
    /** Renders a single material row. */
    function renderMissingMaterial(material: string): React.ReactNode {
        const farmData = progression.materialFarmData.get(material);
        const requiredCount = farmData?.count ?? 0;
        const ownedCount = inventoryUpgrades[material] ?? 0;
        const coveredByInventory = requiredCount > 0 && ownedCount >= requiredCount;
        const label = UpgradesService.getUpgrade(material)?.label ?? material;
        const lockedLocations = farmData?.unfarmableLocations ?? [];
        const neededBy = progression.charactersNeedingMaterials.get(material) ?? [];

        if (coveredByInventory) {
            return (
                <div
                    key={'covered_material-' + material}
                    className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <MaterialIcon material={material} size={22} />
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-(--muted-fg)">already in inventory</span>
                    </div>
                    <span className="font-mono text-xs text-green-700 tabular-nums dark:text-green-400">
                        {ownedCount}/{requiredCount}
                    </span>
                </div>
            );
        }

        return (
            <div
                key={'missing_material-' + material}
                className="flex items-start justify-between gap-3 px-4 py-2 text-sm">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                    <MaterialIcon material={material} size={22} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium">{label}</span>
                            {neededBy.length > 0 && (
                                <>
                                    <span className="text-xs text-(--muted-fg)">needed by</span>
                                    {neededBy.map(unitId => {
                                        const unit = CharactersService.getUnit(unitId);
                                        return (
                                            <UnitShardIcon
                                                key={'needed-' + material + '-' + unitId}
                                                icon={unit?.roundIcon ?? ''}
                                                height={20}
                                                width={20}
                                                tooltip={unit?.name}
                                            />
                                        );
                                    })}
                                </>
                            )}
                        </div>
                        {lockedLocations.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-(--muted-fg)">Unlocks at:</span>
                                {lockedLocations.map(loc => (
                                    <CampaignLocation key={loc.id} location={loc} unlocked={false} short={true} />
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-(--muted-fg)">No known campaign locations</span>
                        )}
                    </div>
                </div>
                <span className="font-mono text-xs text-(--muted-fg) tabular-nums">need {requiredCount}</span>
            </div>
        );
    }

    /** Renders a section showing all materials currently unfarmable. */
    function renderMissingMaterials(): React.ReactNode {
        const missingMaterials: Set<string> = new Set<string>();
        for (const entry of campaignDataArray) {
            for (const savings of entry[1].savings) {
                if (!savings.canFarmPrior) {
                    missingMaterials.add(CampaignsProgressionService.getReward(savings.battle));
                }
            }
        }
        if (missingMaterials.size === 0) {
            return undefined;
        }

        return (
            <Accordion
                disableGutters
                square
                className="overflow-hidden rounded-xl! border-l-[3px] border-(--border) border-l-amber-500 bg-transparent shadow-none [&::before]:hidden">
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                    aria-controls="unfarmable-materials-content"
                    id="unfarmable-materials-accordion"
                    className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Locked materials blocking your goals</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-800 tabular-nums dark:bg-amber-900/30 dark:text-amber-300">
                            {missingMaterials.size}
                        </span>
                    </div>
                </AccordionSummary>
                <AccordionDetails
                    id="unfarmable-materials-content"
                    className="grid grid-cols-1 divide-y divide-(--border) border-t border-(--border) p-0! sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {[...missingMaterials.values()].map(material => renderMissingMaterial(material))}
                </AccordionDetails>
            </Accordion>
        );
    }

    return <div>{renderMissingMaterials()}</div>;
};

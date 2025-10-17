import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { CampaignData, CampaignsProgressData } from './campaign-progression.models';
import { CampaignsProgressionService } from './campaign-progression.service';

interface Props {
    progression: CampaignsProgressData;
    campaignDataArray: CampaignData[];
}

export const CampaignProgressionUnfarmableMaterials: React.FC<Props> = ({ progression, campaignDataArray }) => {
    /** Renders an information table row about a specific missing material. */
    function renderMissingMaterial(material: string): any {
        return (
            <tr key={'missing_material-' + material}>
                <td>Cannot currently farm {UpgradesService.getUpgrade(material)?.label}, needed by</td>
                {progression.charactersNeedingMaterials.get(material)?.map(unitId => {
                    return [
                        <td key={'missing_material-' + material + '-character-' + unitId}>
                            <UnitShardIcon
                                icon={CharactersService.getUnit(unitId)?.roundIcon ?? '(undefined)'}
                                height={30}
                                width={30}
                                tooltip={CharactersService.getUnit(unitId)?.name}
                            />
                        </td>,
                    ];
                })}
            </tr>
        );
    }

    /** Renders a table showing all materials currently unfarmable. */
    function renderMissingMaterials(): any {
        const missingMaterials: Set<string> = new Set<string>();
        campaignDataArray.forEach((entry, ignored) => {
            for (const savings of entry[1].savings) {
                if (!savings.canFarmPrior) {
                    missingMaterials.add(CampaignsProgressionService.getReward(savings.battle));
                }
            }
        });
        if (missingMaterials.size == 0) {
            return <span></span>;
        }

        return (
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="unfarmable-materials-accordion">
                    Unfarmable Materials
                </AccordionSummary>
                <AccordionDetails>
                    <table key="missing_materials">
                        <tbody>
                            {Array.from(missingMaterials.values()).map(material => {
                                return renderMissingMaterial(material);
                            })}
                        </tbody>
                    </table>
                </AccordionDetails>
            </Accordion>
        );
    }

    return <div id="missing_materials">{renderMissingMaterials()}</div>;
};

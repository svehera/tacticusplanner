import React from 'react';

import { StaticDataService } from 'src/services/static-data.service';

import { CampaignData, CampaignsProgressData } from 'src/v2/features/campaign-progression/campaign-progression.models';

import { CharacterImage } from 'src/shared-components/character-image';

interface Props {
    progression: CampaignsProgressData;
    campaignDataArray: CampaignData[];
}

export const CampaignProgressionUnfarmableMaterials: React.FC<Props> = ({ progression, campaignDataArray }) => {
    /** Renders an information table row about a specific missing material. */
    function renderMissingMaterial(material: string): any {
        return (
            <tr key={'missing_material-' + material}>
                <td>Cannot currently farm {material}, needed by</td>
                {progression.charactersNeedingMaterials.get(material)?.map((unitId, ignored) => {
                    return [
                        <td key={'missing_material-' + material + '-character-' + unitId}>
                            <CharacterImage
                                icon={StaticDataService.getUnit(unitId)?.icon ?? '(undefined)'}
                                imageSize={30}
                                tooltip={StaticDataService.getUnit(unitId)?.icon}
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
                    missingMaterials.add(savings.battle.reward);
                }
            }
        });
        if (missingMaterials.size == 0) {
            return <span></span>;
        }

        return (
            <table key="missing_materials">
                <tbody>
                    {Array.from(missingMaterials.values()).map(material => {
                        return renderMissingMaterial(material);
                    })}
                </tbody>
            </table>
        );
    }

    return <div id="missing_materials">{renderMissingMaterials()}</div>;
};

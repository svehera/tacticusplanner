import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { CampaignImage } from '@/fsd/4-entities/campaign';
import {
    ICharacterUpgradeRankGoal,
    ICharacterUpgradeMow,
    ICharacterUnlockGoal,
    ICharacterAscendGoal,
} from '@/fsd/4-entities/goal';

// eslint-disable-next-line import-x/no-internal-modules
import { GoalsService } from 'src/v2/features/goals/goals.service';

import { CampaignProgressionAscensionGoals } from './campaign-progression-ascension-goals';
import { CampaignProgressionHeader } from './campaign-progression-header';
import { CampaignProgressionMaterialGoals } from './campaign-progression-material-goals';
import { CampaignProgressionRankupGoals } from './campaign-progression-rankup-goals';
import { CampaignProgressionUnfarmableMaterials } from './campaign-progression-unfarmable-materials';
import { CampaignData } from './campaign-progression.models';
import { CampaignsProgressionService } from './campaign-progression.service';

export const CampaignProgression = () => {
    const { goals, characters, mows, campaignsProgress } = useContext(StoreContext);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals } = useMemo(() => {
        return GoalsService.prepareGoals(goals, [...characters, ...mows], false);
    }, [goals, characters, mows]);

    const progression = useMemo(() => {
        const allGoals: Array<
            ICharacterUpgradeMow | ICharacterUpgradeRankGoal | ICharacterUnlockGoal | ICharacterAscendGoal
        > = shardsGoals;
        for (const goal of upgradeRankOrMowGoals) {
            allGoals.push(goal);
        }
        return CampaignsProgressionService.computeCampaignsProgress(allGoals, campaignsProgress);
    }, [allGoals, campaignsProgress]);

    const campaignDataArray = useMemo(() => {
        const result: CampaignData[] = [];
        for (const [campaign, data] of progression.data.entries()) {
            result.push([campaign, data]);
        }
        return result;
    }, [progression]);

    /** @returns the goal with the given ID. */
    function getGoal(
        goalId: string
    ): ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow | undefined {
        let filtered: Array<
            ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow
        > = upgradeRankOrMowGoals.filter(goal => goal.goalId == goalId);
        if (filtered.length == 0) {
            filtered = shardsGoals.filter(goal => goal.goalId == goalId);
        }
        if (filtered.length == 0) {
            console.warn('goalId not found { ' + goalId + ' ' + upgradeRankOrMowGoals.length + ' }');
            return undefined;
        }
        if (filtered.length > 1) {
            console.warn('multiple goals with ID ' + goalId + ' found.');
        }
        return filtered[0];
    }

    /**
     * @returns the rankup goal with the given ID, or undefined if it either
     *          doesn't exist, or isn't a rankup goal.
     */
    function getRankUpGoal(goalId: string): ICharacterUpgradeRankGoal | undefined {
        const goal = getGoal(goalId);
        if (goal && 'rankStart' in goal) return goal as ICharacterUpgradeRankGoal;
        return undefined;
    }

    /**
     * @returns the row data for the grid that holds the ascend-character
     *          goals related to the campaign.
     */
    function getRankUpGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            const goal = getRankUpGoal(goalId);
            if (goal) rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
        }
        return rowData;
    }

    /**
     * @returns the ascension goal with the given ID, or undefined if it either
     *          doesn't exist, or isn't an ascension goal.
     */
    function getAscensionGoal(goalId: string): ICharacterAscendGoal | undefined {
        const goal = getGoal(goalId);
        if (goal && 'rarityStart' in goal && 'starsStart' in goal) return goal as ICharacterAscendGoal;
        return undefined;
    }

    /**
     * @returns the row data for the grid that holds the ascend-character
     *          goals related to the campaign.
     */
    function getAscendGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            const goal = getAscensionGoal(goalId);
            if (goal) {
                rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
            }
        }
        return rowData;
    }

    /**
     * @returns the row data for the grid that holds the material
     * requirements related to the campaign.
     */
    function getCampaignMaterialData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const savings of campaignData[1].savings) {
            rowData.push({ savingsData: [{ savings: savings }] });
        }
        return rowData;
    }

    /**
     * @returns a string representing the current battle to
     * be completed for the given campaign. This is only ever
     * called for incomplete campaigns.
     */
    function getCampaignProgress(campaign: string): any {
        let ret = <>Completed</>;
        Object.entries(campaignsProgress).forEach(([key, value]) => {
            if (key == campaign) {
                ret = <div>Last Completed Battle: {value}</div>;
            }
        });
        return ret;
    }

    return (
        <div key="root">
            <CampaignProgressionHeader />
            <CampaignProgressionUnfarmableMaterials progression={progression} campaignDataArray={campaignDataArray} />
            <h1>Campaign Progression</h1>
            {campaignDataArray.map((entry, ignored) => {
                return (
                    <div key={'accordion_' + entry[0]}>
                        {entry[1].savings.length > 0 && (
                            <Accordion defaultExpanded={entry[1].savings.length > 0}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1-content"
                                    id={'accordion-details-' + entry[0]}>
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <CampaignImage campaign={entry[0]} />
                                                </td>
                                                {!isMobile && (
                                                    <>
                                                        <td>{entry[0]}</td>
                                                        <td> - </td>
                                                        <td>{getCampaignProgress(entry[0])}</td>
                                                    </>
                                                )}
                                            </tr>
                                        </tbody>
                                    </table>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Accordion>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id={'ascend-goals-' + entry[0]}>
                                            Ascension/Unlock Goals
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {getAscendGoalData(entry).length > 0 && (
                                                <CampaignProgressionAscensionGoals
                                                    campaignData={entry}
                                                    goals={shardsGoals}
                                                />
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                    <Accordion>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id={'rankup-goals-' + entry[0]}>
                                            Rank-Up Goals
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {getRankUpGoalData(entry).length > 0 && (
                                                <CampaignProgressionRankupGoals
                                                    campaignData={entry}
                                                    goals={upgradeRankOrMowGoals}
                                                />
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                    {getCampaignMaterialData(entry).length > 0 && (
                                        <CampaignProgressionMaterialGoals
                                            campaignData={entry}
                                            progression={progression}
                                        />
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

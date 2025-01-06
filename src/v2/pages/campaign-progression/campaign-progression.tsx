import React, { useContext, useMemo } from 'react';
import { IUnitData } from 'src/v2/features/characters/characters.models';
import { Rank } from 'src/models/enums';

import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { StoreContext } from 'src/reducers/store.provider';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import {
    BattleSavings,
    CampaignProgressData,
    CampaignsProgressionService,
} from 'src/v2/features/goals/campaigns-progression';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CharacterImage } from 'src/shared-components/character-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { MiscIcon } from 'src/shared-components/misc-icon';
import { StaticDataService } from 'src/services/static-data.service';
import { ArrowForward } from '@mui/icons-material';
import {
    ICharacterUpgradeRankGoal,
    ICharacterUpgradeMow,
    ICharacterUnlockGoal,
    ICharacterAscendGoal,
} from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';

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
        return CampaignsProgressionService.computeCampaignsProgress(allGoals, campaignsProgress, {});
    }, [allGoals, campaignsProgress]);

    type CampaignData = [string, CampaignProgressData];

    const campaignDataArray = useMemo(() => {
        const result: CampaignData[] = [];
        for (const [campaign, data] of progression.data.entries()) {
            result.push([campaign, data]);
        }
        return result;
    }, [progression]);

    function getRequiredMaterialCount(material: string): number {
        return progression.materialFarmData.get(material)?.count ?? 0;
    }

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

    function getGoalUnit(goalId: string): IUnitData | undefined {
        return StaticDataService.getUnit(getGoal(goalId)?.unitId);
    }

    function getGoalShardsUnit(characterName: string): IUnitData | undefined {
        return StaticDataService.getUnit(characterName);
    }

    function getGoalRankStart(goalId: string): number {
        return getGoal(goalId)?.rankStart ?? 0;
    }

    function getGoalRankEnd(goalId: string): number {
        return getGoal(goalId)?.rankEnd ?? 1;
    }

    function getRankLookupHref(goalId: string): string {
        const rankStart = Math.max(getGoalRankStart(goalId), 1);
        const rankEnd = getGoalRankEnd(goalId);
        return (
            '../../learn/rankLookup?character=' +
            getGoalUnit(goalId)?.id +
            '&rankStart=' +
            Rank[rankStart] +
            '&rankEnd=' +
            Rank[Math.max(rankStart + 1, rankEnd)]
        );
    }

    return (
        <div key="root">
            This page is in beta. If you see bugs, or have features you would like
            <br />
            added, please contact cpunerd via{' '}
            <a href="https://discord.gg/8mcWKVAYZf">
                Discord&apos;s Tacticus
                <br />
                Planner channel
            </a>
            .
            <p />
            Found this site helpful? Consider using the maintainer&apos;s Refer-A-Friend code &apos;DUG-38-VAT&apos;.
            <br />
            Maybe also <a href="https://buymeacoffee.com/tacticusplanner">buy</a> the site owner a coffee?
            <p />
            Instructions:
            <ol>
                <li>
                    Enter your roster in the <a href="../../input/wyo">Who You Own</a> page.
                </li>
                <li>
                    Enter your campaign progress in the <a href="../../input/campaignsProgress">Campaigns Progress</a>{' '}
                    page.
                </li>
                <li>
                    Enter your goals in the <a href="../../plan/goals">Goals</a> page.
                </li>
                <li>
                    Review these results and adust your goals.
                    <ol>
                        <li>
                            Consider the balance between spending energy to upgrade the necessary units and beating the
                            requisite battles.
                        </li>
                        <li>
                            Work towards the goals that have the biggest bang for your buck. Least energy spent yielding
                            the most energy saved.
                        </li>
                        <li>
                            Mark your goals complete as you progress, and revisit this page periodically for more
                            advice.
                        </li>
                    </ol>
                </li>
            </ol>
            <p />
            Known Issues and Future Work
            <ol>
                <li>
                    The UI is bad. But I&apos;m a backend engineer, so I&apos;d need suggestions on how to spruce it up.
                </li>
                <li>
                    Ignores current inventory but uses applied upgrades. The savings would be hard to parse if we used
                    the current inventory.
                </li>
                <li>Doesn&apos;t work well with ascension/unlock goals.</li>
                <li>Ignores upgrade-ability goals.</li>
                <li>
                    Machines of war are taken into consideration in total cost, but aren&apos;t displayed anywhere
                    because they aren&apos;t relevant to campaigns.
                </li>
                <li>
                    <s>Rank-up goal costs should link to the rank-lookup page.</s>
                </li>
                <li>
                    <s>Target rank icons should link to the goal page.</s>
                </li>
                <li>
                    <s>The large campaign icons should link to the campaign&apos;s &apos;Learn&apos; page.</s>
                </li>
                <li>
                    Battles that unlock a material should display the character icons of all characters requiring the
                    material.
                </li>
                <li>
                    The amount saved should link to a small dialog or tooltip explaining the savings (computation with
                    farmable nodes, new computation with this node).
                </li>
            </ol>
            <h1>Campaign Progression</h1>
            {campaignDataArray.map((entry, ignored) => {
                return (
                    <div key={entry[0]}>
                        <table>
                            <tbody>
                                <tr key="{entry[0]}_header_row">
                                    <td colSpan={2}>
                                        <a href="../../learn/campaigns">
                                            <CampaignImage campaign={entry[0]} />
                                        </a>
                                    </td>
                                    <td colSpan={7}>{entry[0]}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table>
                            <tbody>
                                {Array.from(
                                    entry[1].goalCost.entries().map((goal, ignored) => {
                                        return (
                                            <tr key={goal[0]}>
                                                <td>
                                                    <a href={getRankLookupHref(goal[0])}>
                                                        <CharacterImage
                                                            icon={getGoalUnit(goal[0])?.icon ?? '(undefined)'}
                                                            imageSize={30}
                                                            tooltip={getGoalUnit(goal[0])?.icon}
                                                        />
                                                    </a>
                                                </td>
                                                <td align="center">
                                                    <RankImage rank={getGoalRankStart(goal[0])} />
                                                </td>
                                                <td>
                                                    <ArrowForward />
                                                </td>
                                                <td align="center">
                                                    <a href="../../plan/goals">
                                                        <RankImage rank={getGoalRankEnd(goal[0])} />
                                                    </a>
                                                </td>
                                                {goal[1] >= 0 && (
                                                    <td>
                                                        <a href={getRankLookupHref(goal[0])}>costs</a>
                                                    </td>
                                                )}
                                                {goal[1] >= 0 && (
                                                    <td>
                                                        <a href={getRankLookupHref(goal[0])}>
                                                            {goal[1]}{' '}
                                                            <MiscIcon icon={'energy'} height={15} width={15} />
                                                        </a>
                                                    </td>
                                                )}
                                                {goal[1] < 0 && (
                                                    <a href={getRankLookupHref(goal[0])}>
                                                        <td colSpan="3">requires materials currently unfarmable.</td>
                                                    </a>
                                                )}
                                                <td></td>
                                                <td width="100%"></td>
                                            </tr>
                                        );
                                    })
                                )}
                                {entry[1].savings.map((savings, battleNumber) => {
                                    return (
                                        <tr
                                            key={
                                                '&apos;' +
                                                entry[0] +
                                                '_battle_' +
                                                savings.battle.campaign +
                                                '_' +
                                                savings.battle.nodeNumber +
                                                '&apos;'
                                            }>
                                            <td>Beating</td>
                                            <td colSpan={2}>
                                                <CampaignLocation
                                                    key={savings.battle.id}
                                                    location={savings.battle}
                                                    short={true}
                                                    unlocked={true}
                                                />
                                            </td>
                                            <td>yields</td>
                                            <td>
                                                {UpgradesService.getUpgradeMaterial(savings.battle.reward) && (
                                                    <UpgradeImage
                                                        material={savings.battle.reward}
                                                        iconPath={
                                                            UpgradesService.getUpgradeMaterial(savings.battle.reward)
                                                                ?.icon ?? ''
                                                        }
                                                        rarity={savings.battle.rarityEnum}
                                                        size={30}
                                                    />
                                                )}
                                                {!UpgradesService.getUpgradeMaterial(savings.battle.reward) && (
                                                    <CharacterImage
                                                        icon={
                                                            getGoalShardsUnit(savings.battle.reward)?.icon ??
                                                            '(undefined)'
                                                        }
                                                        imageSize={30}
                                                        tooltip={getGoalShardsUnit(savings.battle.reward)?.icon}
                                                    />
                                                )}
                                            </td>
                                            <td colSpan={2} width="100%">
                                                (goals need <b>{getRequiredMaterialCount(savings.battle.reward)}x</b>),
                                                {savings.wouldUnlockFor.length == 0 && (
                                                    <span>
                                                        saving {savings.savings}{' '}
                                                        <MiscIcon icon={'energy'} height={15} width={15} /> (cumulative{' '}
                                                        {savings.cumulativeSavings}{' '}
                                                        <MiscIcon icon={'energy'} height={15} width={15} />
                                                        ).
                                                    </span>
                                                )}
                                                {savings.wouldUnlockFor.length > 0 && (
                                                    <span> unlocking this material so it can be farmed.</span>
                                                )}
                                            </td>
                                            <td></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <br />
                    </div>
                );
            })}
        </div>
    );
};

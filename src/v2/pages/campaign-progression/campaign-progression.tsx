import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { isMobile } from 'react-device-detect';
import { sum } from 'lodash';

import { Conditional } from 'src/v2/components/conditional';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams, IRowNode, ICellRendererParams, ColGroupDef } from 'ag-grid-community';
import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { ViewControls } from 'src/v2/features/characters/components/view-controls';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';
import { IMow, IUnit, IUnitData, IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';

import { ShareRoster } from 'src/v2/features/share/share-roster';

import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharacterItemDialog } from 'src/shared-components/character-item-dialog';
import { ICharacter2, IMaterial } from 'src/models/interfaces';
import { useAuth } from 'src/contexts/auth';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { EditMowDialog } from 'src/v2/features/characters/dialogs/edit-mow-dialog';
import { BattleSavings, CampaignProgressData, CampaignsProgressionService, FarmData, GoalData } from 'src/v2/features/goals/campaigns-progression';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CharacterImage } from 'src/shared-components/character-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { MiscIcon } from 'src/shared-components/misc-icon';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';
import { StaticDataService } from 'src/services/static-data.service';
import { ArrowForward } from '@mui/icons-material';
import { ICharacterUpgradeRankGoal, ICharacterUpgradeMow, ICharacterUnlockGoal, ICharacterAscendGoal } from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { JsxElement } from 'typescript';

export const CampaignProgression = () => {
  const {
    goals,
    characters,
    mows,
    campaignsProgress,
    dailyRaidsPreferences,
    inventory,
    dailyRaids,
    viewPreferences,
  } = useContext(StoreContext);
  const dispatch = useContext(DispatchContext);
  const navigate = useNavigate();

  const { token: isLoggedIn, shareToken: isRosterShared } = useAuth();

  const [viewControls, setViewControls] = useState<IViewControls>({
    filterBy: viewPreferences.wyoFilter,
    orderBy: viewPreferences.wyoOrder,
  });

  const { allGoals, shardsGoals, upgradeRankOrMowGoals, upgradeAbilities } = useMemo(() => {
    return GoalsService.prepareGoals(goals, [...characters, ...mows], false);
  }, [goals, characters, mows]);

  const progression = useMemo(() => {
    var allGoals: Array<ICharacterUpgradeMow | ICharacterUpgradeRankGoal | ICharacterUnlockGoal | ICharacterAscendGoal> = shardsGoals;
    for (const goal of upgradeRankOrMowGoals) {
      allGoals.push(goal);
    }
    return CampaignsProgressionService.computeCampaignsProgress(
      allGoals, campaignsProgress, {});
  }, [allGoals, campaignsProgress]);

  type CampaignData = [string, CampaignProgressData];

  const campaignDataArray = useMemo(() => {
    var result: CampaignData[] = [];
    for (const [campaign, data] of progression.data.entries()) {
      result.push([campaign, data]);
    }
    return result;
  }, [progression])

  function renderCampaignIcon(campaignName: string): string {
    return campaignName;
  }

  function renderUnitIcon(goalId: string): string {
    return goalId;
  }

  function renderSavings(savings: BattleSavings): string {
    return "Beating battle " + savings.battle.nodeNumber +
      " yields " +
      (<UpgradeImage material={savings.battle.reward} rarity={savings.battle.rarityEnum} />) +
      "), of which our goals require " + getRequiredMaterialCount(savings.battle.reward) +
      ", saving " + savings.savings +
      " energy.";
  }

  function getRequiredMaterialCount(
    material: string,
  ): number {
    return progression.materialFarmData.get(material)?.count ?? 0;
  }

  function getGoal(goalId: string): ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow | undefined {
    var filtered: Array<ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
      = upgradeRankOrMowGoals.filter(goal => goal.goalId == goalId);
    if (filtered.length == 0) {
      filtered = shardsGoals.filter(goal => goal.goalId == goalId);
    }
    if (filtered.length == 0) {
      console.warn("goalId not found { " + goalId + " " + upgradeRankOrMowGoals.length + " }");
      return undefined;
    }
    if (filtered.length > 1) {
      console.warn("multiple goals with ID " + goalId + " found.");
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

  function getMaterialIconPath(material: string): string {
    return material;
  }

  return (
    <div>
      If you find this information helpful, please consider <a
      href="https://buymeacoffee.com/tacticusplanner">buying
      </a> Severyn (the owner of the planner app) a coffee, or using
      cpunerd's (the owner of the this page) Refer-A-Friend code
      "DUG-38-VAT". Either would be very appreciated, but neither
      are expected. Thank you for using the planner!
      <p>
        If you see bugs, or have features you would like added,
        please contact cpunerd via <a
        href="https://discord.gg/8mcWKVAYZf">Discord's</a> Tacticus
        Planner channel.
      </p>
      <p/>
      Instructions:
      <ol>
        <li>Enter your roster in the <a href="../../input/wyo">Who You Own</a> page.</li> 
        <li>Enter your campaign progress in the <a href="../../input/campaignsProgress">Campaigns Progress</a> page.</li>
        <li>Enter your goals in the <a href="../../plan/goals">Goals</a> page.</li>
        <li>Review your results and adust your goals.
          <ol>
            <li>Consider the balance between spending energy to upgrade the necessary units and beating the requisite battles.</li>
            <li>Work towards the goals that have the biggest bang for your buck. Least energy spent yielding the most energy saved.</li>
            <li>Mark your goals complete as you progress, and revisit this page periodically for more advice.</li>
          </ol>
        </li>
      </ol>
      <h1>Campaign Progression</h1>
      {
        campaignDataArray.map((entry, ignored) => {
          return (
            <div>
              <table key="{entry[0]}">
                <tbody>
                  <tr key="{entry[0]}_header_row">
                    <td colSpan={2}>
                      <CampaignImage campaign={entry[0]} />
                    </td>
                    <td colSpan={7}>
                      {entry[0]}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table>
                <tbody>
                  {
                    Array.from(entry[1].goalCost.entries().map((goal, ignored) => {
                      return (
                        <tr key={goal[0]}>
                          <td>
                            <CharacterImage
                              icon={getGoalUnit(goal[0])?.icon ?? "(undefined)"}
                              imageSize={30}
                              tooltip={getGoalUnit(goal[0])?.icon} />
                          </td>
                          <td align="center">
                            <RankImage rank={getGoalRankStart(goal[0])} />
                          </td>
                          <td>
                            <ArrowForward />
                          </td>
                          <td align="center">
                            <RankImage rank={getGoalRankEnd(goal[0])} />
                          </td>
                          <td>
                            costs
                          </td>
                          <td>
                            {(goal[1])}
                            <MiscIcon icon={'energy'} height={15} width={15} />
                          </td>
                          <td></td>
                          <td width="100%"></td>
                        </tr>
                      );
                    }))
                  }
                  {
                    entry[1].savings.map((savings, battleNumber) => {
                      return (
                        <tr key={("'" + entry[0] + "_battle_" + savings.battle.campaign + "_" + savings.battle.nodeNumber + "'")}>
                          <td>
                            Beating
                          </td>
                          <td colSpan={2}>
                            <CampaignLocation
                              key={savings.battle.id}
                              location={savings.battle}
                              short={true}
                              unlocked={true}
                            />
                          </td>
                          <td>
                            yields
                          </td>
                          <td>
                            {
                              UpgradesService.getUpgradeMaterial(savings.battle.reward) &&
                              (<UpgradeImage material={savings.battle.reward}
                                iconPath={UpgradesService.getUpgradeMaterial(savings.battle.reward)?.icon ?? ""}
                                rarity={savings.battle.rarityEnum}
                                size={30} />
                              )
                            }
                            {!UpgradesService.getUpgradeMaterial(savings.battle.reward) &&
                              (<CharacterImage
                                icon={getGoalShardsUnit(savings.battle.reward)?.icon ?? "(undefined)"}
                                imageSize={30}
                                tooltip={getGoalShardsUnit(savings.battle.reward)?.icon} />
                              )
                            }
                          </td>
                          <td colSpan={2} width="100%">
                            (goals need {getRequiredMaterialCount(savings.battle.reward)}x),
                            saving {savings.savings}
                            <MiscIcon icon={'energy'} height={15} width={15} /> (cumulative {savings.cumulativeSavings} <MiscIcon icon={'energy'} height={15} width={15} />).
                          </td>
                          <td></td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
              <br />
            </div>
          )
        })
      }
    </div>
  )
}

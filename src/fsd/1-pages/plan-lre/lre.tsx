/* eslint-disable import-x/no-internal-modules */
import GridViewIcon from '@mui/icons-material/GridView';
import SettingsIcon from '@mui/icons-material/Settings';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Switch, Tab, Tabs } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';
import { SetGoalDialog } from '@/shared-components/goals/set-goal-dialog';

import { Rank } from '@/fsd/5-shared/model';
import { RarityStars } from '@/fsd/5-shared/model/enums/rarity-stars.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { IAutoTeamsPreferences, RequirementStatus } from '@/fsd/3-features/lre';
import { ILreViewSettings } from '@/fsd/3-features/view-settings';

import { LeBattleService } from './le-battle.service';
import { LeBattles } from './le-battles';
import { LeProgress } from './le-progress';
import { useLreProgress } from './le-progress.hooks';
import { LeTokenomics } from './le-tokenomics';
import { LegendaryEvent } from './legendary-event';
import { LegendaryEventSettings } from './legendary-event-settings';
import { useLre } from './lre-hook';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { LreSectionsSettings } from './lre-sections-settings';
import { LreSettings } from './lre-settings';
import { LreSection } from './lre.models';
import PointsTable from './points-table';
import { TokenDisplay, TokenEstimationService, TokenUse } from './token-estimation-service';

export const Lre: React.FC = () => {
    const { leSelectedTeams, leSettings, viewPreferences, autoTeamsPreferences, characters, mows, goals } =
        useContext(StoreContext);
    const { legendaryEvent, section, showSettings, openSettings, closeSettings, changeTab } = useLre();
    const { model, createNewModel, updateDto } = useLreProgress(legendaryEvent);
    const dispatch = useContext(DispatchContext);
    const updatePreferencesOption = (setting: keyof ILreViewSettings, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    const resolvedCharacters = CharactersService.resolveStoredCharacters(characters);
    const resolvedMows = MowsService.resolveAllFromStorage(mows);

    const upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[] = GoalsService.prepareGoals(
        goals,
        [...resolvedCharacters, ...resolvedMows],
        false
    ).upgradeRankOrMowGoals;

    const leUnitAscensionData = useMemo(() => {
        const character = resolvedCharacters.find(c => c.snowprintId === legendaryEvent.unitSnowprintId);
        if (character !== undefined && character.rank !== Rank.Locked) {
            return { rank: character.rank, rarity: character.rarity, stars: character.stars };
        }
        return { rank: Rank.Locked, rarity: Rarity.Legendary, stars: RarityStars.None };
    }, [resolvedCharacters, legendaryEvent.unitSnowprintId]);

    const tokens: TokenUse[] = TokenEstimationService.computeAllTokenUsage(
        model.tracksProgress,
        leSelectedTeams[legendaryEvent.id]?.teams ?? []
    );
    const tokenDisplays: TokenDisplay[] = TokenEstimationService.getTokenDisplays(
        tokens,
        model,
        leUnitAscensionData.rarity,
        leUnitAscensionData.stars
    );

    const currentPoints = useMemo(() => {
        return model.tracksProgress
            .map(track => TokenEstimationService.computeCurrentPointsInTrack(track))
            .reduce((a, b) => a + b, 0);
    }, [model, legendaryEvent]);

    const updateSettings = (
        settings: ILreViewSettings,
        autoTeamsSettings: IAutoTeamsPreferences,
        recommendedFirst: string[],
        recommendedLast: string[]
    ) => {
        for (const setting in settings) {
            const value = settings[setting as keyof ILreViewSettings];
            dispatch.viewPreferences({ type: 'Update', setting: setting as keyof ILreViewSettings, value });
        }
        for (const setting in autoTeamsSettings) {
            const value = autoTeamsSettings[setting as keyof IAutoTeamsPreferences];
            dispatch.autoTeamsPreferences({ type: 'Update', setting: setting as keyof IAutoTeamsPreferences, value });
        }
        dispatch.characters({ type: 'UpdateBias', recommendedFirst, recommendedLast });
    };

    const updateView = (gridView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'lreGridView', value: gridView });
    };

    const updateGoalsPreview = (preview: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'lreGoalsPreview', value: preview });
    };

    const nextTokenMaybe = (tokenIndex: number): void => {
        if (tokenDisplays.length === 0 || tokenIndex < 0 || tokenIndex >= tokenDisplays.length) return;
        const token = tokenDisplays[tokenIndex];
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;

        const hasRestrictions = token.restricts.some(r => !LreRequirementStatusService.isDefaultObjective(r.id));
        let leModel = model;
        let modified = false;
        for (const restrict of token.restricts) {
            if (!hasRestrictions || !LreRequirementStatusService.isDefaultObjective(restrict.id)) {
                modified = true;
                leModel = createNewModel(
                    leModel,
                    token.track as 'alpha' | 'beta' | 'gamma',
                    token.battleNumber,
                    restrict.id,
                    RequirementStatus.MaybeClear
                );
            }
        }
        if (modified) updateDto(leModel);
    };

    const nextTokenStopped = (tokenIndex: number): void => {
        if (tokenDisplays.length === 0 || tokenIndex < 0 || tokenIndex >= tokenDisplays.length) return;
        const token = tokenDisplays[tokenIndex];
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;

        let leModel = model;
        for (const restrict of token.restricts) {
            leModel = createNewModel(
                leModel,
                token.track as 'alpha' | 'beta' | 'gamma',
                token.battleNumber,
                restrict.id,
                RequirementStatus.StopHere
            );
        }
        updateDto(leModel);
    };

    const battles = LeBattleService.getBattleSetForCharacter(legendaryEvent.id);

    const progress = TokenEstimationService.computeCurrentProgress(
        model,
        leUnitAscensionData.rank === Rank.Locked ? Rarity.Legendary : (leUnitAscensionData?.rarity ?? Rarity.Legendary),
        leUnitAscensionData.rank === Rank.Locked ? RarityStars.None : (leUnitAscensionData?.stars ?? RarityStars.None)
    );

    const renderTabContent = () => {
        switch (section) {
            case LreSection.teams:
                return <LegendaryEvent legendaryEvent={legendaryEvent} upgradeRankOrMowGoals={upgradeRankOrMowGoals} />;
            case LreSection.progress:
                return <LeProgress legendaryEvent={legendaryEvent} progress={progress} />;
            case LreSection.tokenomics:
                return (
                    <LeTokenomics
                        legendaryEvent={legendaryEvent}
                        key="tokenomics"
                        model={model}
                        battles={battles}
                        tokens={tokens}
                        tokenDisplays={tokenDisplays}
                        tracksProgress={model.tracksProgress}
                        currentPoints={currentPoints}
                        showP2P={leSettings.showP2POptions ?? true}
                        nextTokenMaybe={nextTokenMaybe}
                        nextTokenStopped={nextTokenStopped}
                        createNewModel={createNewModel}
                        updateDto={updateDto}
                    />
                );
            case LreSection.battles:
                return battles !== undefined && <LeBattles key="battles" battles={battles} />;
            case LreSection.leaderboard:
                return <PointsTable legendaryEvent={legendaryEvent} />;
            case LreSection.settings:
                return <LegendaryEventSettings />;
            default:
                return <div>Default Content</div>;
        }
    };

    function toggleView() {
        updateView(!viewPreferences.lreGridView);
    }

    function toggleGoalsPreview() {
        updateGoalsPreview(!viewPreferences.lreGoalsPreview);
    }

    return (
        <>
            <div className="flex-box between wrap">
                <Tabs
                    value={section}
                    onChange={changeTab}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="scrollable auto tabs example">
                    <Tab label="Teams" value={LreSection.teams} />
                    <Tab label="My Progress" value={LreSection.progress} />
                    <Tab label="Tokenomics" value={LreSection.tokenomics} />
                    <Tab label="Battles" value={LreSection.battles} />
                    <Tab label="Leaderboard" value={LreSection.leaderboard} />
                    <Tab label="Settings" value={LreSection.settings} />
                </Tabs>
                {[LreSection.teams].includes(section) && (
                    <>
                        <LreSectionsSettings lreViewSettings={viewPreferences} save={updatePreferencesOption} />
                    </>
                )}

                {[LreSection.teams].includes(section) && (
                    <div className="flex-box gap10 wrap">
                        <div className="flex-box" onClick={toggleGoalsPreview}>
                            Goals Preview
                            <Switch checked={viewPreferences.lreGoalsPreview} />
                        </div>
                        <div className="flex-box" onClick={toggleView}>
                            <TableRowsIcon color={!viewPreferences.lreGridView ? 'primary' : 'disabled'} />
                            <Switch checked={viewPreferences.lreGridView} />
                            <GridViewIcon color={viewPreferences.lreGridView ? 'primary' : 'disabled'} />
                        </div>
                        <Button size="small" variant="outlined" onClick={openSettings}>
                            {isMobile ? '' : 'Settings'} <SettingsIcon />
                        </Button>

                        <SetGoalDialog />
                    </div>
                )}
            </div>

            <div className="mt-2.5" key={legendaryEvent.id}>
                {renderTabContent()}
            </div>

            {showSettings && (
                <LreSettings
                    onClose={closeSettings}
                    lreViewSettings={viewPreferences}
                    autoTeamsSettings={autoTeamsPreferences}
                    characters={resolvedCharacters}
                    save={updateSettings}
                />
            )}
        </>
    );
};

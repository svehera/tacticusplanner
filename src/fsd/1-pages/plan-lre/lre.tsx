import GridViewIcon from '@mui/icons-material/GridView';
import SettingsIcon from '@mui/icons-material/Settings';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Switch, Tab, Tabs } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useEffect, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';
// eslint-disable-next-line import-x/no-internal-modules
import { SetGoalDialog } from '@/shared-components/goals/set-goal-dialog';

import { CharactersService } from '@/fsd/4-entities/character';
import { LegendaryEventService } from '@/fsd/4-entities/lre';

import { IAutoTeamsPreferences } from '@/fsd/3-features/lre';
// eslint-disable-next-line import-x/no-internal-modules
import { ProgressState } from '@/fsd/3-features/lre-progress/enums';
import { ILreViewSettings } from '@/fsd/3-features/view-settings';

import { LeBattleService } from './le-battle.service';
import { LeBattles } from './le-battles';
import { LeProgress } from './le-progress';
import { useLreProgress } from './le-progress.hooks';
import { LeTokenomics } from './le-tokenomics';
import { LegendaryEvent } from './legendary-event';
import { LegendaryEventSettings } from './legendary-event-settings';
import { useLre } from './lre-hook';
import { LreSectionsSettings } from './lre-sections-settings';
import { LreSettings } from './lre-settings';
import { LreSection } from './lre.models';
import PointsTable from './points-table';
import { TokenEstimationService } from './token-estimation-service';

export const Lre: React.FC = () => {
    const { leSelectedTeams, viewPreferences, autoTeamsPreferences, characters } = useContext(StoreContext);
    const { legendaryEvent, section, showSettings, openSettings, closeSettings, changeTab } = useLre();
    const { toggleBattleState } = useLreProgress(legendaryEvent);
    const { model } = useLreProgress(legendaryEvent);
    const dispatch = useContext(DispatchContext);
    const updatePreferencesOption = (setting: keyof ILreViewSettings, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);

    const tokens = useMemo(() => {
        return TokenEstimationService.computeAllTokenUsage(
            model.tracksProgress,
            leSelectedTeams[legendaryEvent.id]?.teams ?? []
        );
    }, [model, leSelectedTeams, legendaryEvent]);

    const currentPoints = useMemo(() => {
        return model.tracksProgress
            .map(track => TokenEstimationService.computeCurrentPoints(track))
            .reduce((a, b) => a + b, 0);
    }, [model, legendaryEvent]);

    useEffect(() => {}, [section]);

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

    const tokenDisplays = useMemo(
        () => TokenEstimationService.getTokenDisplays(tokens, currentPoints),
        [tokens, currentPoints]
    );

    const nextTokenCompleted = (tokenIndex: number): void => {
        if (tokenDisplays.length === 0 || tokenIndex < 0 || tokenIndex >= tokenDisplays.length) return;
        const token = tokenDisplays[tokenIndex];
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;

        // Used to handle the "Mark Completed" option in tokenomics.
        // trackId -> track;
        // battleIndex -> battleNumber.
        // reqId -> restricts
        for (const restrict of token.restricts) {
            toggleBattleState(
                token.track as 'alpha' | 'beta' | 'gamma',
                token.battleNumber,
                restrict.id,
                ProgressState.completed
            );
        }
    };

    const battles = LeBattleService.getBattleSetForCharacter(legendaryEvent.id);

    const eventStartTime = () => {
        if (LegendaryEventService.getActiveEvent()?.id !== legendaryEvent.id) return undefined;
        return LegendaryEventService.getLegendaryEventStartDates()[0].getTime();
    };

    const renderTabContent = () => {
        switch (section) {
            case LreSection.teams:
                return <LegendaryEvent legendaryEvent={legendaryEvent} />;
            case LreSection.progress:
                return <LeProgress legendaryEvent={legendaryEvent} />;
            case LreSection.tokenomics:
                return (
                    <LeTokenomics
                        key="tokenomics"
                        battles={battles}
                        tokens={tokens}
                        tokenDisplays={tokenDisplays}
                        tracksProgress={model.tracksProgress}
                        currentPoints={currentPoints}
                        eventStartTime={eventStartTime()}
                        nextTokenCompleted={nextTokenCompleted}
                        toggleBattleState={toggleBattleState}
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

    console.log('section: ', section, ' - ', LreSection[section]);

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

import GridViewIcon from '@mui/icons-material/GridView';
import SettingsIcon from '@mui/icons-material/Settings';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Divider, Switch, Tab, Tabs } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';
// eslint-disable-next-line import-x/no-internal-modules
import { SetGoalDialog } from '@/shared-components/goals/set-goal-dialog';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';

import { IAutoTeamsPreferences } from '@/fsd/3-features/lre';
import { ILreViewSettings } from '@/fsd/3-features/view-settings';

import { LeProgress } from './le-progress';
import { LegendaryEvent } from './legendary-event';
import { useLre } from './lre-hook';
import { LreSectionsSettings } from './lre-sections-settings';
import { LreSettings } from './lre-settings';
import { LreSection } from './lre.models';
import PointsTable from './points-table';

export const Lre: React.FC = () => {
    const { viewPreferences, autoTeamsPreferences, characters } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const updatePreferencesOption = (setting: keyof ILreViewSettings, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    const resolvedCharacters = useMemo(() => {
        return characters.map(x => {
            const ret: ICharacter2 = { ...x };
            const staticChar = CharactersService.resolveCharacter(x.snowprintId ?? x.name);
            ret.name = staticChar?.snowprintId ?? x.name;
            return ret;
        });
    }, [characters]);

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

    const { legendaryEvent, section, showSettings, openSettings, closeSettings, changeTab } = useLre();

    const renderTabContent = () => {
        switch (section) {
            case LreSection.teams:
                return <LegendaryEvent legendaryEvent={legendaryEvent} />;
            case LreSection.progress:
                return <LeProgress legendaryEvent={legendaryEvent} />;
            case LreSection.leaderboard:
                return <PointsTable legendaryEvent={legendaryEvent} />;
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
                    <Tab label="Leaderboard" value={LreSection.leaderboard} />
                </Tabs>
                {[LreSection.teams].includes(section) && (
                    <>
                        <LreSectionsSettings lreViewSettings={viewPreferences} save={updatePreferencesOption} />
                        {/*<Divider style={{ height: 42, margin: '0 10px' }} orientation={'vertical'} />*/}
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

            <div style={{ marginTop: 10 }} key={legendaryEvent.id}>
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

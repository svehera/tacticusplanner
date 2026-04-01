import React, { useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';
import { LreTrackId, LegendaryEventEnum } from '@/fsd/4-entities/lre';

import {
    ILegendaryEvent,
    ILegendaryEventTrack,
    IRequirementProgress,
    ILreTeam,
    RequirementStatus,
} from '@/fsd/3-features/lre';

import { LreTeamsCard } from './lre-teams-card';
import { LreTeamsTable } from './lre-teams-table';

interface Props {
    legendaryEvent: ILegendaryEvent;
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[];
    autoAddTeam: (section: LreTrackId, requirements: string[], characters: ICharacter2[]) => void;
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    editTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
    progress: Record<string, number>;
    selectedRequirementsSection: Record<string, boolean | IRequirementProgress>;
    updateRestrictionSelection: (
        eventId: LegendaryEventEnum,
        section: LreTrackId,
        restrictionName: string,
        selected: boolean
    ) => void;
    clearSectionSelection: (eventId: LegendaryEventEnum, section: LreTrackId) => void;
}

export const LegendaryEventTrack: React.FC<Props> = ({
    legendaryEvent,
    track,
    startAddTeam,
    progress,
    teams: selectedTeams,
    upgradeRankOrMowGoals,
    autoAddTeam,
    editTeam,
    deleteTeam,
    selectedRequirementsSection,
    updateRestrictionSelection,
    clearSectionSelection,
}) => {
    const { viewPreferences } = useContext(StoreContext);

    const restrictions = useMemo(() => {
        const result: string[] = [];

        for (const x of track.unitsRestrictions.filter(x => !x.hide)) {
            const saved = selectedRequirementsSection[x.name];
            let selected: boolean;

            if (saved === undefined) {
                // Not set, use default
                selected = x.selected ?? false;
            } else if (typeof saved === 'boolean') {
                // Legacy boolean format
                selected = saved;
            } else if (typeof saved === 'object' && 'status' in saved) {
                // New IRequirementProgress format - only Cleared (1) and PartiallyCleared (4) count as "selected"
                selected =
                    saved.status === RequirementStatus.Cleared || saved.status === RequirementStatus.PartiallyCleared;
            } else {
                selected = false;
            }

            if (selected) {
                result.push(x.name);
            }
        }

        return result;
    }, [selectedRequirementsSection, track.unitsRestrictions]);

    return viewPreferences.lreGridView ? (
        <div className="flex-1">
            <LreTeamsCard
                legendaryEvent={legendaryEvent}
                track={track}
                teams={selectedTeams}
                upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                startAddTeam={startAddTeam}
                editTeam={editTeam}
                deleteTeam={deleteTeam}
                progress={progress}
                restrictions={restrictions}
                updateRestrictionSelection={updateRestrictionSelection}
            />
        </div>
    ) : (
        <div className="size-full overflow-auto">
            <LreTeamsTable
                legendaryEvent={legendaryEvent}
                track={track}
                teams={selectedTeams}
                upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                autoAddTeam={autoAddTeam}
                startAddTeam={startAddTeam}
                editTeam={editTeam}
                progress={progress}
                restrictions={restrictions}
                updateRestrictionSelection={updateRestrictionSelection}
                clearSectionSelection={clearSectionSelection}
            />
        </div>
    );
};

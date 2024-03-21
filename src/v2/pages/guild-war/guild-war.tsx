import React, { useContext, useState } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { FlexBox } from 'src/v2/components/flex-box';
import { BattlefieldInfo } from 'src/v2/features/guild-war/battlefield-info';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { BfSectionSelect } from 'src/v2/features/guild-war/bf-section-select';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

export const GuildWar = () => {
    const { teams, characters } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [section, setSection] = useState<string>(
        teams.guildWar.teams[0]?.sectionId ?? GuildWarService.defaultSection
    );

    const [teamPotential, setTeamPotential] = useState<number>(0);

    const updateBfLevel = (battlefieldLevel: number) => {
        dispatch.teams({ type: 'UpdateBfLevel', battlefieldLevel });
    };

    return (
        <div>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={teams.guildWar.battlefieldLevel} valueChange={updateBfLevel} />
                <BfSectionSelect value={section} valueChange={setSection} potential={teamPotential} />
            </FlexBox>
        </div>
    );
};

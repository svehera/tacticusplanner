import React, { useContext } from 'react';
import { BattlefieldInfo } from 'src/v2/features/guild-war/battlefield-info';
import { FlexBox } from 'src/v2/components/flex-box';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

export const GuildWar = () => {
    const { teams } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const updateBfLevel = (battlefieldLevel: number) => {
        dispatch.teams({ type: 'UpdateBfLevel', battlefieldLevel });
    };

    return (
        <div>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={teams.guildWar.battlefieldLevel} valueChange={updateBfLevel} />
            </FlexBox>
        </div>
    );
};

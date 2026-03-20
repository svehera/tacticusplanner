import { defaultData } from '../models/constants';
import { IGuild, IGuildMember, SetStateAction } from '../models/interfaces';

export type GuildAction =
    | SetStateAction<IGuild>
    | {
          type: 'SaveGuildMembers';
          members: IGuildMember[];
      };

export const guildReducer = (state: IGuild, action: GuildAction): IGuild => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.guild;
        }

        case 'SaveGuildMembers': {
            const newMembers = action.members
                .filter(x => x.username.length > 0 || (!!x.userId?.length && !!x.inGameName?.length))
                .slice(0, 30)
                .map((x, index) => ({ ...x, index: index }));
            return {
                ...state,
                members: newMembers,
            };
        }

        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.value}`);
        }
    }
};

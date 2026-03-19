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
                .filter(x => !!x.username.length || (!!x.userId?.length && !!x.inGameName?.length))
                .slice(0, 30)
                .map((x, i) => ({ ...x, index: i }));
            return {
                ...state,
                members: newMembers,
            };
        }

        default: {
            throw new Error();
        }
    }
};

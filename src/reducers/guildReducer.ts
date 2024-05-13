import { IGuild, IGuildMember, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';

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
                .filter(x => !!x.username.length)
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

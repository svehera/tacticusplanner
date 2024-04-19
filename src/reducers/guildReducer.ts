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
            const newMembers = action.members.slice(0, 30).map((x, i) => ({ ...x, index: i }));
            return {
                ...state,
                members: newMembers.filter(x => !!x.username || !!x.shareToken),
            };
        }

        default: {
            throw new Error();
        }
    }
};

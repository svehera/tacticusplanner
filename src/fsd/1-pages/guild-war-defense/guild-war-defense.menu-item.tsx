// eslint-disable-next-line import-x/no-internal-modules
import { MenuItem } from '@/models/menu-item';

// eslint-disable-next-line import-x/no-internal-modules
import GuildWarIcon from '@/fsd/5-shared/assets/images/icons/guildWarMono.png';

export const guildWarDefenseMenuItem = new MenuItem(
    'Defense',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Defense" />,
    '/plan/guildWar/defense'
);

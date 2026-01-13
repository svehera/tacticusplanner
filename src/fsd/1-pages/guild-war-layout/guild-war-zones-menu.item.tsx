// eslint-disable-next-line import-x/no-internal-modules
import { MenuItem } from '@/models/menu-item';

// eslint-disable-next-line import-x/no-internal-modules
import GuildWarIcon from '@/fsd/5-shared/assets/images/icons/guildWarMono.png';

export const guildWarZonesMenuItem = new MenuItem(
    'Zones',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Zones" />,
    '/plan/guildWar/zones',
    'War zones'
);

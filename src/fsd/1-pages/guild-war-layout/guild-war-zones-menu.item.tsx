// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import GuildWarIcon from 'src/assets/images/icons/guildWarMono.png';

export const guildWarZonesMenuItem = new MenuItem(
    'Zones',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Zones" />,
    '/plan/guildWar/zones',
    'War zones'
);

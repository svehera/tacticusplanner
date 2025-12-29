// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import GuildWarIcon from 'src/assets/images/icons/guildWarMono.png';

export const guildWarDefenseMenuItem = new MenuItem(
    'Defense',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Defense" />,
    '/plan/guildWar/defense'
);

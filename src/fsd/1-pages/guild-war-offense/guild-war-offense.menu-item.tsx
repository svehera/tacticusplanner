// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import GuildWarIcon from '@/fsd/5-shared/assets/images/icons/guildWarMono.png';

export const guildWarOffenseMenuItem = new MenuItem(
    'Offense',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Offense" />,
    '/plan/guildWar/offense'
);

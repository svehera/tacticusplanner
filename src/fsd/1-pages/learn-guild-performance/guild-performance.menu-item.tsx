import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const guildPerformanceMenuItem = new MenuItem(
    'Guild Performance',
    <TrendingUpIcon />,
    '/learn/guildPerformance'
);

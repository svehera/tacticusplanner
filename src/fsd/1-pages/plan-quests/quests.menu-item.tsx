import ExploreIcon from '@mui/icons-material/Explore';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const questsMenuItem = new MenuItem('Quests', <ExploreIcon />, '/plan/quests');

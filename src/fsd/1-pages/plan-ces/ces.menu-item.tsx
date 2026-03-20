import FilterListIcon from '@mui/icons-material/FilterList';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const cesMenuItem = new MenuItem('Campaign Events', <FilterListIcon />, '/plan/ces');

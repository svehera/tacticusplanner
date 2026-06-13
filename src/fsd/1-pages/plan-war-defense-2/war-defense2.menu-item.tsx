import ShieldIcon from '@mui/icons-material/Shield';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const warDefense2MenuItem = new MenuItem('Defense 2', <ShieldIcon />, '/plan/wardefense2');

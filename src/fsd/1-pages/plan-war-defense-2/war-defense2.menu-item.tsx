import SecurityIcon from '@mui/icons-material/Security';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const warDefense2MenuItem = new MenuItem('Defense 2', <SecurityIcon />, '/plan/wardefense2');

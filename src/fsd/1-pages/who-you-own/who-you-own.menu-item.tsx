import HowToRegIcon from '@mui/icons-material/HowToReg';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const wyoMenuItem = new MenuItem('Who You Own', <HowToRegIcon />, '/input/wyo');

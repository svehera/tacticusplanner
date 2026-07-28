import WhatshotIcon from '@mui/icons-material/Whatshot';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: matches plan-quests' menu-item pattern
import { MenuItem } from '@/models/menu-item';

export const survivalMenuItem = new MenuItem('Survival', <WhatshotIcon />, '/plan/survival');

import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const bulkGoalCreatorMenuItem = new MenuItem('Bulk Goal Creator', <PlaylistAddCheckIcon />, '/plan/bulkGoals');

import GroupsIcon from '@mui/icons-material/Groups';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const teamsMenuItem = new MenuItem('Teams (End-of-Life May 2026)', <GroupsIcon />, '/plan/teams');

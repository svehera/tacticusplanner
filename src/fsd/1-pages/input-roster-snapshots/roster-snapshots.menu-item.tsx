import GroupsIcon from '@mui/icons-material/Groups';

// eslint-disable-next-line import-x/no-internal-modules
import { MenuItem } from '@/models/menu-item';

export const rosterSnapshotsMenuItem = new MenuItem(
    'Roster Snapshots (BETA)',
    <GroupsIcon />,
    '/input/roster-snapshots'
);

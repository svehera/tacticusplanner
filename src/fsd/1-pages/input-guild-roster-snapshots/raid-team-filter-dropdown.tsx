import ExpandMore from '@mui/icons-material/ExpandMore';
import { Button, Checkbox, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

interface RaidTeamOption {
    name: string;
    isSelected: boolean;
}

interface RaidTeamFilterDropdownProps {
    teams: RaidTeamOption[];
    onToggleTeam: (name: string) => void;
}

export const RaidTeamFilterDropdown = ({ teams, onToggleTeam }: RaidTeamFilterDropdownProps) => {
    const [anchorElement, setAnchorElement] = useState<HTMLElement | undefined>();
    const selectedCount = teams.filter(t => t.isSelected).length;
    const label =
        selectedCount === 0 ? 'All Raid Teams' : `${selectedCount} raid team${selectedCount === 1 ? '' : 's'}`;

    return (
        <>
            <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={event => setAnchorElement(event.currentTarget)}
                sx={{ textTransform: 'none', justifyContent: 'space-between', minWidth: 180, maxWidth: 260 }}>
                <span>{label}</span>
                <ExpandMore className="ml-1" />
            </Button>
            <Menu
                anchorEl={anchorElement}
                open={Boolean(anchorElement)}
                onClose={() => setAnchorElement(undefined)}
                PaperProps={{ sx: { width: 'min(92vw, 300px)', maxHeight: '72vh' } }}>
                {teams.map(team => (
                    <MenuItem key={team.name} dense onClick={() => onToggleTeam(team.name)}>
                        <ListItemIcon>
                            <Checkbox edge="start" checked={team.isSelected} tabIndex={-1} disableRipple />
                        </ListItemIcon>
                        <ListItemText primary={team.name} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

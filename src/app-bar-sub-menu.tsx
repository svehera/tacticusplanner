import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapse, List, ListItemButton } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuItemTP } from './models/menu-items';

export const AppBarSubMenu = ({ rootLabel, options }: { rootLabel: string; options: Array<MenuItemTP> }) => {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);

    const handleClick = () => {
        setOpen(!open);
    };
    return (
        <List
            sx={{ width: 150, maxWidth: 360 }}
            component="nav"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}>
            <ListItemButton onClick={handleClick}>
                <ListItemText primary={rootLabel} style={{ fontWeight: 500 }} />
                {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse
                in={open}
                timeout="auto"
                unmountOnExit
                sx={{ width: 150, position: 'absolute', zIndex: 1000, backgroundColor: '#1976d2' }}>
                <List component="div" disablePadding>
                    {options.map(option => (
                        <ListItemButton
                            key={option.label}
                            onClick={() => {
                                setOpen(false);
                                navigate(option.routeWeb);
                            }}>
                            <ListItemText primary={option.label} />
                        </ListItemButton>
                    ))}
                </List>
            </Collapse>
        </List>
    );
};

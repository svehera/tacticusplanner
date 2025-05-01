import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material';
import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuItemTP, Conditional } from '@/fsd/5-shared/ui';

export const AppBarSubMenu = ({ rootLabel, options }: { rootLabel: string; options: Array<MenuItemTP> }) => {
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
                className="bg-[var(--navbar)]"
                unmountOnExit
                sx={{ width: 150, position: 'absolute', zIndex: 1000 }}>
                <List component="div" disablePadding>
                    {options.map(option => (
                        <MenuOption key={option.label} option={option} onOptionClick={() => setOpen(false)} />
                    ))}
                </List>
            </Collapse>
        </List>
    );
};

const MenuOption: React.FC<{ option: MenuItemTP; onOptionClick: () => void }> = ({ option, onOptionClick }) => {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);

    const handleOptionClick = (o: MenuItemTP) => {
        setOpen(false);
        navigate(o.routeWeb);
        onOptionClick();
    };

    return (
        <ListItemButton
            onClick={() => {
                if (!option.subMenu.length) {
                    handleOptionClick(option);
                } else {
                    setOpen(value => !value);
                }
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => {
                setOpen(false);
            }}>
            <ListItemText primary={option.label} />
            <Conditional condition={!!option.subMenu.length}>{open ? <ChevronLeft /> : <ChevronRight />}</Conditional>
            <Collapse
                in={open}
                timeout="auto"
                unmountOnExit
                className="bg-[var(--navbar)]"
                sx={{
                    position: 'absolute',
                    width: 150,
                    left: 150,
                    top: 0,
                    zIndex: 1001,
                }}>
                <List component="div" disablePadding>
                    {option.subMenu.map(subOption => (
                        <ListItemButton
                            key={subOption.label}
                            onClick={() => {
                                handleOptionClick(subOption);
                            }}>
                            <ListItemText primary={subOption.label} />
                        </ListItemButton>
                    ))}
                </List>
            </Collapse>
        </ListItemButton>
    );
};

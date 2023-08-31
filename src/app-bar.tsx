import React, { ChangeEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BrowserView } from 'react-device-detect';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Divider, Menu, MenuItem, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { PersonalDataService } from './services';

const TopAppBar = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const downloadJson = () => {
        const data = PersonalDataService.data;
        const jsonData = JSON.stringify(data, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'tacticus-planner-data.json';
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const content = e.target?.result as string;
                    PersonalDataService.data = JSON.parse(content);
                    PersonalDataService.save();
                    window.location = '/' as unknown as Location;
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            };

            reader.readAsText(file);
        }
    };
    
    const nav = (
        <BrowserView>
            <Button component={Link} to={'./wyo'} color="inherit">Who You Own</Button>
            <Button component={Link} to={'./characters'} color="inherit">Characters</Button>
            <Button component={Link} to={'./dirtyDozen'} color="inherit">Dirty Dozen</Button>
            <Button component={Link} to={'./le'} color="inherit">Legendary Events</Button>
        </BrowserView>
    );
    
    const menu = (
        <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button',
            }}
        >
            <MenuItem onClick={handleClose}>
                <Button component={Link} to={'./wyo'} color="inherit">Who You Own</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button component={Link} to={'./characters'} color="inherit">Characters</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button component={Link} to={'./dirtyDozen'} color="inherit">Dirty Dozen</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button component={Link} to={'./le'} color="inherit">Legendary Events</Button>
            </MenuItem>
            
            <Divider/>
            
            <MenuItem onClick={handleClose}>
                <Tooltip title={'Import your personal data (Who You Own, etc.)'}>
                    <Button color="inherit" onClick={() => inputRef.current?.click()}>Import data</Button>
                </Tooltip>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Tooltip title={'Back up your personal data (Who You Own, etc.)'}>
                    <Button onClick={downloadJson} color="inherit">Export data</Button>
                </Tooltip>
            </MenuItem>
            
            <Divider/>
            
            <MenuItem onClick={handleClose}>
                <Button component={Link} to={'./'} color="inherit">About</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button component={Link} to={'./contacts'} color="inherit">Contacts</Button>
            </MenuItem>
        </Menu>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <input
                ref={inputRef}
                style={{ display: 'none' }}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
            />
            <AppBar position="static">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button component={Link} to={'./'} color="inherit">
                        <Typography variant="h4" component="div">
                            Tacticus Planner
                        </Typography>
                    </Button>
                    <div style={{ display: 'flex' }}>
                        {nav}
                        <Button
                            id="basic-button"
                            aria-controls={open ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            color="inherit"
                            onClick={handleClick}
                        >
                            <MenuIcon/> 
                        </Button>
                        {menu}
                    </div>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default TopAppBar;
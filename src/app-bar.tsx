import React, { ChangeEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Divider, Menu, MenuItem, Tooltip, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import { PersonalDataService } from './services';
import { isTabletOrMobileMediaQuery } from './models/constants';

const TopAppBar = () => {
    const isTabletOrMobile = useMediaQuery(isTabletOrMobileMediaQuery);
    const [title, setTitle] = useState('Tacticus Planner');
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
    
    const nav = isTabletOrMobile ? undefined : (
        <div>
            <Button onClick={() => setTitle('Who You Own')} component={Link} to={'./wyo'} color="inherit">Who You Own</Button>
            <Button onClick={() => setTitle('Characters')} component={Link} to={'./characters'} color="inherit">Characters</Button>
            <Button onClick={() => setTitle('Dirty Dozen')} component={Link} to={'./dirtyDozen'} color="inherit">Dirty Dozen</Button>
            <Button onClick={() => setTitle('Legendary Events')} component={Link} to={'./le'} color="inherit">Legendary Events</Button>
        </div>
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
                <Button onClick={() => setTitle('Who You Own')} component={Link} to={'./wyo'} color="inherit">Who You Own</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button onClick={() => setTitle('Characters')} component={Link} to={'./characters'} color="inherit">Characters</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button onClick={() => setTitle('Dirty Dozen')} component={Link} to={'./dirtyDozen'} color="inherit">Dirty Dozen</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button onClick={() => setTitle('Legendary Events')} component={Link} to={'./le'} color="inherit">Legendary Events</Button>
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
                <Button onClick={() => setTitle('Tacticus Planner')} component={Link} to={'./'} color="inherit">Home/F.A.Q.</Button>
            </MenuItem>
            <MenuItem onClick={handleClose}>
                <Button onClick={() => setTitle('Contacts')} component={Link} to={'./contacts'} color="inherit">Contacts</Button>
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
                    <Typography variant={ isTabletOrMobile ? 'h5' : 'h4'} component="div">
                        {title}
                    </Typography>
                    <div style={{ display: 'flex' }}>
                        {nav}
                        <Button
                            id="basic-button"
                            color="inherit"
                            component={Link} to={'./mobile'}
                        >
                            <SmartphoneIcon/>
                        </Button>
                        <Button
                            id="basic-button"
                            color="inherit"
                            component={Link} to={'./'}
                        >
                            <ComputerIcon/>
                        </Button>
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
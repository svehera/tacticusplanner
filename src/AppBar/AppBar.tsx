import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ChangeEvent, useRef } from 'react';
import { PersonalDataService } from '../store/personal-data/personal-data.service';
import { Link } from 'react-router-dom';
import { Divider, Menu, MenuItem, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const ButtonAppBar = () => {
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
                    location.reload();
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            };

            reader.readAsText(file);
        }
    };

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
                    <div>
                        <Button component={Link} to={'./wyo'} color="inherit">Who You Own</Button>
                        <Button component={Link} to={'./characters'} color="inherit">Characters</Button>
                        <Button component={Link} to={'./dirtyDozen'} color="inherit">Dirty Dozen</Button>
                        <Button component={Link} to={'./le'} color="inherit">Legendary Events</Button>
                        <Button
                            id="basic-button"
                            aria-controls={open ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            color="inherit"
                            onClick={handleClick}
                        >
                            <MenuIcon/> Menu 
                        </Button>
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
                                <Button component={Link} to={'./'} color="inherit">About</Button>
                            </MenuItem>
                            <MenuItem onClick={handleClose}> 
                                <Button component={Link} to={'./contacts'} color="inherit">Contacts</Button>
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
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default ButtonAppBar;
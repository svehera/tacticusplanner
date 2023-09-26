import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Computer as ComputerIcon, Smartphone as PhoneIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const ViewSwitch = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigateToDesktopView = () => {
        localStorage.setItem('preferredView', 'desktop');
        navigate('/');
    };

    const navigateToMobileView = () => {
        localStorage.setItem('preferredView', 'mobile');
        navigate('/mobile');
    };

    return (
        <IconButton color="inherit">
            {!location.pathname.includes('mobile')
                ? (
                    <Tooltip title="Switch to mobile view">
                        <PhoneIcon onClick={() => navigateToMobileView()}/>
                    </Tooltip>
                )
                : (
                    <Tooltip title="Switch to desktop view">
                        <ComputerIcon onClick={() => navigateToDesktopView()}/>
                    </Tooltip>
                )
            }
        </IconButton>
    );
};

export default ViewSwitch;
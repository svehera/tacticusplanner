import React from 'react';
import { bmcLink, discordInvitationLink } from '../../models/constants';
import { BmcIcon } from 'src/shared-components/icons/bmc.icon';
import IconButton from '@mui/material/IconButton';
import { Link } from 'react-router-dom';

export const Contacts = () => {
    return (
        <div>
            <p>
                Send email to{' '}
                <a href="mailto: tacticusplanner@gmail.com" target={'_blank'} rel="noreferrer">
                    tacticusplanner@gmail.com
                </a>{' '}
                or reach me out in{' '}
                <a href={discordInvitationLink} target={'_blank'} rel="noreferrer">
                    Discord
                </a>
            </p>
            <p>
                <a href="https://github.com/svehera/tacticusplanner" target={'_blank'} rel="noreferrer">
                    GitHub repo
                </a>
            </p>
            <p>
                Buy me a trooper{' '}
                <IconButton component={Link} to={bmcLink} target={'_blank'}>
                    <BmcIcon />
                </IconButton>
            </p>
        </div>
    );
};

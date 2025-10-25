import IconButton from '@mui/material/IconButton';
import { Link } from 'react-router-dom';

import { discordInvitationLink, bmcLink } from '@/fsd/5-shared/ui';
import { BmcIcon } from '@/fsd/5-shared/ui/icons';

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

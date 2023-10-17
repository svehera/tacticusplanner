import React from 'react';
import { discordInvitationLink } from '../../models/constants';

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
        </div>
    );
};

import React from 'react';
import { IGuildMember } from 'src/models/interfaces';
import { FlexBox } from 'src/v2/components/flex-box';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { isMobile } from 'react-device-detect';
import { IconButton } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props {
    index: number;
    member: IGuildMember;
}

export const GuildMemberView: React.FC<Props> = ({ index, member }) => {
    return (
        <FlexBox gap={5} style={{ minWidth: !isMobile ? 450 : 'unset' }}>
            <span>{index + 1}.</span>
            {member.username && member.shareToken && (
                <IconButton
                    size="small"
                    component={Link}
                    target="_blank"
                    to={
                        (isMobile ? '/mobile' : '') +
                        `/sharedRoster?username=${member.username}&shareToken=${member.shareToken}`
                    }>
                    <OpenInNewIcon />
                </IconButton>
            )}

            <b>{member.username}</b>
            {member.username && <span>:</span>}
            <span>{member.shareToken && member.shareToken.slice(0, 5) + '...'}</span>
        </FlexBox>
    );
};

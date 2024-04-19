import React from 'react';
import { IGuildMember } from 'src/models/interfaces';
import { FlexBox } from 'src/v2/components/flex-box';
import { TextField } from '@mui/material';
import { isMobile } from 'react-device-detect';

interface Props {
    index: number;
    member: IGuildMember;
}

export const GuildMemberView: React.FC<Props> = ({ index, member }) => {
    return (
        <FlexBox gap={5} style={{ minWidth: !isMobile ? 450 : 'unset' }}>
            <span>{index + 1}.</span>
            <b>{member.username}</b>
            {member.username && <span>:</span>}
            <span>{member.shareToken && member.shareToken.slice(0, 5) + '...'}</span>
        </FlexBox>
    );
};

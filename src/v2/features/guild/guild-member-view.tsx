import React from 'react';
import { IGuildMember } from 'src/models/interfaces';
import { FlexBox } from 'src/v2/components/flex-box';
import { TextField } from '@mui/material';

interface Props {
    index: number;
    member: IGuildMember;
}

export const GuildMemberView: React.FC<Props> = ({ index, member }) => {
    return (
        <FlexBox gap={5} style={{ minWidth: 450 }}>
            <span>{index + 1}.</span>
            <span>{member.username}</span>
            {member.username && <span>:</span>}
            <span>{member.shareToken && member.shareToken.slice(0, 5) + '...'}</span>
        </FlexBox>
    );
};

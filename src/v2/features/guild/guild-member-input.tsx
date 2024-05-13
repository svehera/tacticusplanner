import React from 'react';
import { IGuildMember } from 'src/models/interfaces';
import { FlexBox } from 'src/v2/components/flex-box';
import { TextField } from '@mui/material';
import { isMobile } from 'react-device-detect';

interface Props {
    index: number;
    member: IGuildMember;
    onUsernameChange: (value: string) => void;
    onShareTokenChange: (value: string) => void;
}

export const GuildMemberInput: React.FC<Props> = ({ index, member, onShareTokenChange, onUsernameChange }) => {
    return (
        <FlexBox gap={5} style={{ minWidth: !isMobile ? 450 : 'unset' }}>
            <span style={{ minWidth: 25 }}>{index + 1}.</span>
            <TextField
                size={'small'}
                label="Username"
                value={member.username}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    onUsernameChange(event.target.value);
                }}
            />
            <TextField
                size={'small'}
                label="Share token"
                value={member.shareToken}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    onShareTokenChange(event.target.value);
                }}
            />
        </FlexBox>
    );
};

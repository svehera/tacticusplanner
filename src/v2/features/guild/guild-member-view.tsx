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
    const hasShareLink = member.username && member.shareToken;
    const hasInGameInfo = member.inGameName && member.userId;

    return (
        <FlexBox gap={5} style={{ minWidth: !isMobile ? 450 : 'unset' }}>
            <span>{index + 1}.</span>
            {hasShareLink && (
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

            {hasShareLink && <b>{member.username}</b>}
            {hasShareLink && hasInGameInfo && <span>|</span>}
            {hasInGameInfo && (
                <>
                    <b>{member.inGameName}</b>
                    <span>({member.userId})</span>
                </>
            )}
            {hasShareLink && (
                <>
                    <span>:</span>
                    <span>{member.shareToken.slice(0, 5) + '...'}</span>
                </>
            )}
        </FlexBox>
    );
};

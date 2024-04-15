import React, { useContext } from 'react';
import { FlexBox } from 'src/v2/components/flex-box';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { GuildMemberInput } from 'src/v2/features/guild/guild-member-input';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { Conditional } from 'src/v2/components/conditional';
import { GuildMemberView } from 'src/v2/features/guild/guild-member-view';
import IconButton from '@mui/material/IconButton';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

export const Guild: React.FC = () => {
    const guildMembersLimit = 30;

    const { guild } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editMode, setEditMode] = React.useState(false);

    const updateUsername = (value: string, index: number) => {
        dispatch.guild({ type: 'UpdateUsername', value, index });
    };

    const updateShareToken = (value: string, index: number) => {
        dispatch.guild({ type: 'UpdateShareToken', value, index });
    };

    return (
        <FlexBox style={{ flexDirection: 'column' }} gap={10}>
            <FlexBox justifyContent={'center'} gap={10} style={{ marginTop: 10 }}>
                <Tooltip
                    title={'Populate Usernames and share tokens from the planner app'}
                    open={editMode}
                    placement={'top'}>
                    <Button
                        variant={'contained'}
                        onClick={() => setEditMode(value => !value)}
                        color={editMode ? 'success' : 'primary'}>
                        {editMode ? 'Stop editing' : 'Edit guild members'}
                    </Button>
                </Tooltip>
                <AccessibleTooltip title={'Go to Guild Insights'}>
                    <IconButton component={Link} to={isMobile ? '/mobile/learn/guildInsights' : '/learn/guildInsights'}>
                        <SavedSearchIcon />
                    </IconButton>
                </AccessibleTooltip>
            </FlexBox>
            <Conditional condition={!editMode}>
                <FlexBox gap={10} wrap justifyContent={'center'}>
                    {...Array.from({ length: guildMembersLimit }, (_, i) => {
                        const guildMember = guild.members.find(x => x.index === i) ?? {
                            username: '',
                            shareToken: '',
                            index: i,
                        };
                        return <GuildMemberView key={i} index={i} member={guildMember} />;
                    })}
                </FlexBox>
            </Conditional>
            <Conditional condition={editMode}>
                <FlexBox gap={10} wrap justifyContent={'center'}>
                    {...Array.from({ length: guildMembersLimit }, (_, i) => {
                        const guildMember = guild.members.find(x => x.index === i) ?? {
                            username: '',
                            shareToken: '',
                            index: i,
                        };
                        return (
                            <GuildMemberInput
                                key={i}
                                index={i}
                                member={guildMember}
                                onUsernameChange={value => updateUsername(value, i)}
                                onShareTokenChange={value => updateShareToken(value, i)}
                            />
                        );
                    })}
                </FlexBox>
            </Conditional>
        </FlexBox>
    );
};

import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React, { useContext, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { IGuildMember } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, AccessibleTooltip, FlexBox, Conditional } from '@/fsd/5-shared/ui';

import { GuildMemberInput } from '@/fsd/3-features/guild/guild-member-input';
import { GuildMemberView } from '@/fsd/3-features/guild/guild-member-view';
import { useValidateGuildMembers } from '@/fsd/3-features/guild/guild.endpoint';
import { ImportGuildExcel } from '@/fsd/3-features/guild/read-guild-from-excel';
import { ImportUserLink } from '@/fsd/3-features/guild/read-user-from-link';

export const Guild: React.FC = () => {
    const guildMembersLimit = 30;

    const { guild } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const { data, loading } = useValidateGuildMembers({ members: guild.members });

    const [editMode, setEditMode] = React.useState(false);
    const [editedMembers, setEditedMembers] = React.useState(guild.members);

    useEffect(() => {
        setEditedMembers(guild.members);
    }, [guild.members]);

    const handleFieldChange = (index: number) => (field: keyof IGuildMember, value: string) => {
        const existingUserIndex = editedMembers.findIndex(x => x.index === index);
        if (existingUserIndex >= 0) {
            const updatedMembers = [...editedMembers];
            updatedMembers[existingUserIndex] = {
                ...updatedMembers[existingUserIndex],
                [field]: value,
            };
            setEditedMembers(updatedMembers);
        } else {
            const newMember: IGuildMember = { username: '', shareToken: '', index, [field]: value };
            setEditedMembers([...editedMembers, newMember]);
        }
    };

    const saveGuildMembers = (members: IGuildMember[]) => {
        dispatch.guild({ type: 'SaveGuildMembers', members });
    };

    const importViaLink = (member: IGuildMember) => {
        const updatedMembers = editedMembers.filter(x => !!x.username.length);
        if (updatedMembers.length >= 30) {
            return;
        }

        const user = updatedMembers.find(x => x.username === member.username);
        if (user) {
            user.shareToken = member.shareToken;
            setEditedMembers([...updatedMembers]);
            saveGuildMembers([...updatedMembers]);
        } else {
            setEditedMembers([...updatedMembers, { ...member, index: updatedMembers.length }]);
            saveGuildMembers([...updatedMembers, { ...member, index: updatedMembers.length }]);
        }
    };

    return (
        <FlexBox className="flex-col" gap={10}>
            {loading && <LoaderWithText loading={true} />}
            <FlexBox className="mt-2.5" justifyContent={'center'} gap={10}>
                <ImportGuildExcel onImport={saveGuildMembers} />
                <ImportUserLink onImport={importViaLink} />
                <Tooltip
                    title={'Populate Usernames and share tokens from the planner app'}
                    open={editMode}
                    placement={'top'}>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            if (editMode) {
                                saveGuildMembers(editedMembers);
                            }
                            setEditMode(value => !value);
                        }}
                        color={editMode ? 'success' : 'primary'}>
                        {editMode ? 'Save changes' : 'Edit guild'}
                    </Button>
                </Tooltip>
                <AccessibleTooltip title={'Go to Guild Insights'}>
                    <IconButton component={Link} to={isMobile ? '/mobile/learn/guildInsights' : '/learn/guildInsights'}>
                        <SavedSearchIcon />
                    </IconButton>
                </AccessibleTooltip>
            </FlexBox>
            {!!data && !data.isValid && (
                <div className="flex-box column">
                    <Typography color="error">Some users data is not valid:</Typography>
                    <ul>
                        {data.invalidUsers
                            .filter(x => !!x.username)
                            .map(x => (
                                <li key={x.username}>
                                    <b>{x.username}</b> - {x.reason}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
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
                        const guildMember = editedMembers.find(x => x.index === i) ?? {
                            username: '',
                            shareToken: '',
                            index: i,
                        };

                        return (
                            <GuildMemberInput
                                key={i}
                                index={i}
                                member={guildMember}
                                onFieldChange={handleFieldChange(i)}
                            />
                        );
                    })}
                </FlexBox>
            </Conditional>
        </FlexBox>
    );
};

import { TextField } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { IGuildMember } from 'src/models/interfaces';

interface Props {
    index: number;
    member: IGuildMember;
    onFieldChange: (field: keyof IGuildMember, value: string) => void;
}

interface FieldConfig {
    label: string;
    field: keyof IGuildMember;
}

const MEMBER_FIELDS: FieldConfig[] = [
    { field: 'username', label: 'Username' },
    { field: 'shareToken', label: 'Share token' },
    { field: 'inGameName', label: 'In-Game Name' },
    { field: 'userId', label: 'In-Game UserId' },
] as const;

export const GuildMemberInput: React.FC<Props> = ({ index, member, onFieldChange }) => {
    return (
        <div className="flex gap-3" style={{ minWidth: !isMobile ? 450 : 'unset' }}>
            <span className="min-w-[25px]">{index + 1}.</span>
            {MEMBER_FIELDS.map(({ field, label }) => (
                <TextField
                    key={field}
                    size={'small'}
                    label={label}
                    value={member[field] ?? ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        onFieldChange(field, event.target.value);
                    }}
                />
            ))}
        </div>
    );
};

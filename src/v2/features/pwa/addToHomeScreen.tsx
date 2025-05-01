import { XIcon } from 'lucide-react';
import React from 'react';

import { Button, Link, buttonStyles } from '@/shared/ui';

interface Props {
    link: string;
    dismiss: () => void;
}

export const AddToHomeScreen: React.FC<Props> = ({ link, dismiss }) => {
    return (
        <div className="block w-full bg-[var(--muted)] p-[10px] flex items-center align-center gap-3 justify-center">
            <div className="flex align-center items-center gap-3">
                <img width="42" height="42" src="/android-chrome-192x192.png" />
                <p>Add Tacticus Planner to home screen</p>
            </div>
            <Link
                className={renderProps => buttonStyles({ ...renderProps, intent: 'primary' })}
                href={link}
                target="_blank">
                How?
            </Link>
            <Button intent="secondary" onPress={dismiss}>
                <XIcon />
            </Button>
        </div>
    );
};

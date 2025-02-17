import React from 'react';
import { Button, Link, buttonStyles } from '@/shared/ui';
import { XIcon } from 'lucide-react';

interface Props {
    link: string;
    installEvent: BeforeInstallPromptEvent | null;
    dismiss: () => void;
}

export const AddToHomeScreen: React.FC<Props> = ({ link, installEvent, dismiss }) => {
    return (
        <div className="block w-full bg-[var(--muted)] p-[10px] flex items-center align-center gap-3 justify-center">
            <div className="flex align-center items-center gap-3">
                <img width="42" height="42" src="/android-chrome-192x192.png" />
                <p>Add Tacticus Planner to home screen</p>
            </div>
            {installEvent ? (
                <Button onPress={installEvent.prompt}>Add</Button>
            ) : (
                <Link
                    className={renderProps => buttonStyles({ ...renderProps, intent: 'primary' })}
                    href={link}
                    target="_blank">
                    Add
                </Link>
            )}
            <Button intent="secondary" onPress={dismiss}>
                <XIcon />
            </Button>
        </div>
    );
};

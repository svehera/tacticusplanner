import { FormControlLabel, Switch } from '@mui/material';
import React from 'react';

import { NumberInput } from '@/fsd/5-shared/ui/input';

import { ILreOccurrenceProgress } from './lre.models';

interface Props {
    occurrence: ILreOccurrenceProgress;
    progressChange: (value: ILreOccurrenceProgress) => void;
}

export const LeProgressOverviewMissions: React.FC<Props> = ({ occurrence, progressChange }) => {
    const getEventName = () => {
        switch (occurrence.eventOccurrence) {
            case 1:
                return 'First event';
            case 2:
                return 'Second event';
            case 3:
                return 'Third event';
        }
    };
    return (
        <div style={{ flex: 1, minWidth: 450 }} className="mr-2">
            <h3>
                <span className="bold">{getEventName()}</span>
                <span className="italic">
                    ({occurrence.freeMissionsProgress}-{occurrence.premiumMissionsProgress}-
                    {+occurrence.bundlePurchased})
                </span>
            </h3>

            <div className="flex gap-5 flex-wrap items-center">
                <NumberInput
                    fullWidth
                    label={'Free missions ' + occurrence.freeMissionsProgress + '/10'}
                    value={occurrence.freeMissionsProgress}
                    valueChange={freeMissionsProgress =>
                        progressChange({
                            ...occurrence,
                            freeMissionsProgress,
                        })
                    }
                    min={0}
                    max={10}
                />

                <NumberInput
                    fullWidth
                    label={'Premium missions ' + occurrence.premiumMissionsProgress + '/10'}
                    value={occurrence.premiumMissionsProgress}
                    valueChange={premiumMissionsProgress =>
                        progressChange({
                            ...occurrence,
                            premiumMissionsProgress,
                        })
                    }
                    min={0}
                    max={10}
                />

                <FormControlLabel
                    label="Bought 300 Currency bundle"
                    control={
                        <Switch
                            checked={occurrence.bundlePurchased}
                            onChange={(_, bundlePurchased) =>
                                progressChange({
                                    ...occurrence,
                                    bundlePurchased,
                                })
                            }
                        />
                    }
                />
            </div>
        </div>
    );
};

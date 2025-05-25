import { FormControlLabel, Switch } from '@mui/material';
import React from 'react';

import { NumberInput } from '@/fsd/5-shared/ui/input/number-input';

import { ILreOccurrenceProgress } from 'src/v2/features/lre/lre.models';

interface Props {
    occurence: ILreOccurrenceProgress;
    progressChange: (value: ILreOccurrenceProgress) => void;
}

export const LeProgressOverviewMissions: React.FC<Props> = ({ occurence, progressChange }) => {
    const getEventName = () => {
        switch (occurence.eventOccurrence) {
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
                    ({occurence.freeMissionsProgress}-{occurence.premiumMissionsProgress}-{+occurence.bundlePurchased})
                </span>
            </h3>

            <div className="flex gap-5 flex-wrap items-center">
                <NumberInput
                    fullWidth
                    label={'Free missions ' + occurence.freeMissionsProgress + '/10'}
                    value={occurence.freeMissionsProgress}
                    valueChange={freeMissionsProgress =>
                        progressChange({
                            ...occurence,
                            freeMissionsProgress,
                        })
                    }
                    min={0}
                    max={10}
                />

                <NumberInput
                    fullWidth
                    label={'Premium missions ' + occurence.premiumMissionsProgress + '/10'}
                    value={occurence.premiumMissionsProgress}
                    valueChange={premiumMissionsProgress =>
                        progressChange({
                            ...occurence,
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
                            checked={occurence.bundlePurchased}
                            onChange={(_, bundlePurchased) =>
                                progressChange({
                                    ...occurence,
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

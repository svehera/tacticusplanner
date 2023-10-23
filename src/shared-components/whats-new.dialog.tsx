import React, { useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import { StaticDataService } from '../services';
import { IReleaseNote, IVersionReleaseNotes } from '../models/interfaces';
import { WhatsNewImage } from './whatsnew-image';
import { Link } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import './whats-new-dialog.css';

export const WhatsNewDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { seenAppVersion } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const whatsNew = StaticDataService.whatsNew;

    const handleClose = () => {
        const currentAppVersion = localStorage.getItem('appVersion');
        if (seenAppVersion !== currentAppVersion) {
            dispatch.seenAppVersion(currentAppVersion);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} fullWidth>
            <DialogTitle>{"What's New"}</DialogTitle>
            <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme => theme.palette.grey[500],
                }}>
                <CloseIcon />
            </IconButton>
            <DialogContent>
                <Box className="whats-new">
                    {whatsNew.releaseNotes.map(x => (
                        <VersionReleaseNotes key={x.version} releaseNotes={x} />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant={'contained'}>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const VersionReleaseNotes = ({ releaseNotes }: { releaseNotes: IVersionReleaseNotes }) => {
    return (
        <div>
            <h2>
                {releaseNotes.type} - {releaseNotes.version} ({releaseNotes.date})
            </h2>
            {!releaseNotes.new.length ? undefined : (
                <ReleaseNotes subtitle="New" version={releaseNotes.version} releaseNotes={releaseNotes.new} />
            )}

            {!releaseNotes.minor.length ? undefined : (
                <ReleaseNotes subtitle="Minor" version={releaseNotes.version} releaseNotes={releaseNotes.minor} />
            )}

            {!releaseNotes.bugFixes.length ? undefined : (
                <ReleaseNotes
                    subtitle="Bug Fixes"
                    version={releaseNotes.version}
                    releaseNotes={releaseNotes.bugFixes}
                />
            )}
        </div>
    );
};

const ReleaseNotes = ({
    subtitle,
    releaseNotes,
    version,
}: {
    subtitle: 'New' | 'Minor' | 'Bug Fixes';
    version: string;
    releaseNotes: IReleaseNote[];
}) => {
    return (
        <div>
            <h3>{subtitle}</h3>
            <ul>
                {releaseNotes.map((releaseNote, index) => (
                    <li key={index}>
                        {releaseNote.text}{' '}
                        {releaseNote.route ? (
                            <span>
                                (<Link to={releaseNote.route}>link</Link>)
                            </span>
                        ) : undefined}
                        {!releaseNote.subPoints?.length ? undefined : (
                            <ul>
                                {releaseNote.subPoints.map((subPoint, subPointIndex) => (
                                    <li key={subPointIndex}> {subPoint}</li>
                                ))}
                            </ul>
                        )}
                        {!releaseNote.images?.length
                            ? undefined
                            : releaseNote.images.map((image, imageIndex) => (
                                  <WhatsNewImage
                                      key={imageIndex}
                                      path={version + '/' + image.path}
                                      imageSize={image.size}
                                  />
                              ))}
                    </li>
                ))}
            </ul>
        </div>
    );
};

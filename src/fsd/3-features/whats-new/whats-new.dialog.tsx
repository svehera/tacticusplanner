import CloseIcon from '@mui/icons-material/Close';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { WhatsNewImage } from './whats-new-image';
import { releaseNotes } from './whats-new.data';
import { IReleaseNote, IVersionReleaseNotes } from './whats-new.model';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const WhatsNewDialog: React.FC<Props> = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen} fullWidth>
            <DialogTitle>{"What's New"}</DialogTitle>
            <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme => theme.palette.grey[500],
                }}>
                <CloseIcon />
            </IconButton>
            <DialogContent>
                <Box className="m-5">
                    {releaseNotes.map(x => (
                        <VersionReleaseNotes key={x.version} releaseNotes={x} />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant={'contained'}>
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
            <ul className="pb-3">
                {releaseNotes.map((releaseNote, index) => (
                    <li key={index} className="pb-3">
                        {releaseNote.text}{' '}
                        {releaseNote.route && !isMobile ? (
                            <span>
                                (<Link to={releaseNote.route}>link</Link>)
                            </span>
                        ) : undefined}
                        {releaseNote.mobileRoute && isMobile ? (
                            <span>
                                (<Link to={releaseNote.mobileRoute}>link</Link>)
                            </span>
                        ) : undefined}
                        {!releaseNote.subPoints?.length ? undefined : (
                            <ul className="pl-5">
                                {releaseNote.subPoints.map((subPoint, subPointIndex) => (
                                    <li key={subPointIndex} className="pb-2">
                                        {' '}
                                        {subPoint}
                                    </li>
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

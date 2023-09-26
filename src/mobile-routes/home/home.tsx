import React, { ChangeEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { PersonalDataService } from '../../services';
import ViewSwitch from '../../shared-components/view-switch';

export const Home = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const content = e.target?.result as string;
                    PersonalDataService.data = JSON.parse(content);
                    PersonalDataService.save();
                    alert('Your data successfully uploaded');
                    window.location = '/' as unknown as Location;
                } catch (error) {
                    alert('There is error while uploading your data');
                    console.error('Error parsing JSON:', error);
                }
            };

            reader.readAsText(file);
        }
    };

    return (
        <div>
            <input
                ref={inputRef}
                style={{ display: 'none' }}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
            />
            <Box sx={{ display: 'flex', textAlign: 'center', justifyContent: 'flex-end' }}>
                <ViewSwitch/>
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <Avatar sx={{ width: 32, height: 32 }}>M</Avatar>
                </IconButton>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleClose}>
                    <Button color='inherit' onClick={() => inputRef.current?.click()}>
                        <UploadIcon/> Import
                    </Button>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <Button color='inherit' onClick={() => PersonalDataService.downloadJson()}>
                        <DownloadIcon/>  Export
                    </Button>
                </MenuItem>
            </Menu>
            <h3 style={{ textAlign: 'center' }}>Plan your success in Tacticus,<br/> No more Google Sh**t</h3>

            <div>
                <p>
                    Big Thanks to <b><a href="https://www.youtube.com/@DBPreacherTacticus" target={'_blank'}
                        rel="noreferrer">DB Preacher: Tacticus</a></b> for his content
                    and <a href="https://youtu.be/aD2ky2BxX_g?si=43Hk2O84QL23EzMY" target={'_blank'}
                        rel="noreferrer">work</a> that inspired me for creating this web app
                </p>
                <p>
                    Shout out to <a href="https://tacticus.fandom.com/wiki/Tacticus_Wiki" target={'_blank'}
                        rel="noreferrer">Tacticus Wiki</a>
                    and <a
                        href="https://docs.google.com/spreadsheets/u/0/d/1al2IWwvTP3QOhHtfr6P8stdlA48ED4JFrtK8wDKznrk/htmlview"
                        target={'_blank'} rel="noreferrer">(Towen) EN Labs T.A.C.T.I.C.U.S</a>
                    for collecting and publishing game data. It was very helpful in creating this app.
                </p>
            </div>

            <h3 style={{ textAlign: 'center' }}>F.A.Q. and Instructions</h3>

            <div>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>What is this web app?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>This web is made to make your planning in the mobile title <a href="https://tacticusgame.com/"
                            target={'_blank'} rel="noreferrer">Warhammer
                            40K Tacticus.</a> easier.</p>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>What does it do?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>You can use it to find out which of your chars are the best for each Legendary Event and an
                            overall
                            rating.</p>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>What features it has?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p> &quot;Who You Own&quot; - You enter which characters you have unlocked and what rank they
                            are.</p>
                        <p> &quot;Characters&quot; - View and filter characters stats.</p>
                        <p> &quot;Dirty Dozen&quot; -<Link
                            to={'https://tacticus.fandom.com/wiki/Infographics#Dirty_Dozen_Series'}
                            target={'_blank'}>Nandi&apos;s</Link> DirtyDozen infographic in table format</p>
                        <p> &quot;Legendary Events&quot; - page contains all future Legendary events with target dates
                        </p>
                        <ul>
                            <li>Characters filters - use to show only characters you have unlocked or characters that are
                                required for campaigns.
                            </li>
                            <li>Event Details - All the details of which characters can do participate in each match per
                                track
                                i.e. Alpha/Beta/Gamma.
                            </li>
                            <li>Your Selected Teams - table of characters you&apos;ve selected for each track i.e.
                                Alpha/Beta/Gamma.
                            </li>
                            <li>Event Best Characters - tables of characters that scores the most points in the event (Best
                                Overall, Your Best, Selected Best).
                            </li>
                            <li>Overall Best Characters - same as &quot;Event Best Characters&quot; except it displayed
                                combined
                                data from all legendary events
                            </li>
                        </ul>
                        <p> &quot;Import&quot; - Import your personal data that you&apos;ve backed up with Export
                            feature.</p>
                        <p> &quot;Export&quot; - Back up personal data on your device to import it in case of current state
                            is
                            lost.</p>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>How do I use it?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>1. Go to the &quot;Who You Own&quot; page, check characters you have unlocked and set the current rank of
                            your characters in the drop down menu. </p>
                        <p>2. Go to the &quot;Legendary Events&quot; page then to specific event and select your teams on the Event
                            Details table </p>
                        <p>3. View &quot;Event Best Characters&quot; table to understand what characters you should prioritize in
                            preparation for the legendary event</p>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>I found a bug? I have an idea? I want to reach you out?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>Send email to <a href="mailto: tacticusplanner@gmail.com" target={'_blank'}
                            rel="noreferrer">tacticusplanner@gmail.com</a> or reach me out in <a
                            href="https://discord.gg/daK7y6f8" target={'_blank'} rel="noreferrer">Discord</a></p>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>What are future plans for the Tacticus Planner?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <p>UI/UX improvements</p>
                        <p>Ukrainian localization</p>
                        <p>Google Drive integration</p>
                        <p>PvP roles</p>
                        <p>&quot;My Lists&quot; feature - create your own PvP, Guild raids lists.</p>
                        <p>More personal data on Who You Own page - abilities level, power</p>
                        <p>Login feature - share your data across multiple devices.</p>
                    </AccordionDetails>
                </Accordion>
            </div>
        </div>
    );
};

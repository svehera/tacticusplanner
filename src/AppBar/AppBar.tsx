import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ChangeEvent, useRef } from 'react';
import { PersonalDataService } from '../store/personal-data/personal-data.service';

const ButtonAppBar = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    const downloadJson = () => {
        const data = PersonalDataService.data;
        const jsonData = JSON.stringify(data, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'tacticus-planner-data.json';
        link.click();

        URL.revokeObjectURL(url);
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
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            };

            reader.readAsText(file);
        }
    };
    
    return (
        <Box sx={{ flexGrow: 1 }}>
            <input
                ref={inputRef}
                style={{ display: 'none' }}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
            />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Tacticus Planner
                    </Typography>
                    <Button color="inherit">Who You Own</Button>
                    <Button color="inherit" onClick={() => inputRef.current?.click()}>Import</Button>
                    <Button onClick={downloadJson} color="inherit">Export</Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default ButtonAppBar;
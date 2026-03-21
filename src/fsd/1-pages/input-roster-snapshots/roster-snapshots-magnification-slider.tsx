import { ZoomIn, ZoomOut } from '@mui/icons-material';
import { Slider } from '@mui/material';

export const RosterSnapshotsMagnificationSlider = ({
    zoom,
    setZoom,
}: {
    zoom: number;
    setZoom: (value: number) => void;
}) => {
    return (
        <div className="flex items-center gap-2">
            <ZoomOut fontSize="small" />
            <div className="min-w-[100px]">
                <Slider
                    size="small"
                    min={0.25}
                    max={2}
                    step={0.05}
                    value={zoom}
                    onChange={(_, value) => {
                        setZoom(value as number);
                    }}
                    valueLabelDisplay="auto"
                    aria-label="unit size"
                />
            </div>
            <ZoomIn fontSize="small" />
        </div>
    );
};

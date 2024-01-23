import React from 'react';
import './dirty-dozen-score.css';

export const Score = ({ value }: { value: number }) => {
    let backgroundColor: string;
    switch (value) {
        case 5: {
            backgroundColor = '#01BE64';
            break;
        }
        case 4.5: {
            backgroundColor = '#7ED857';
            break;
        }
        case 4: {
            backgroundColor = '#CBFC80';
            break;
        }
        case 3.5: {
            backgroundColor = '#F1D153';
            break;
        }
        case 3: {
            backgroundColor = '#FFBD59';
            break;
        }
        case 2.5: {
            backgroundColor = '#FE904E';
            break;
        }
        case 2: {
            backgroundColor = '#F05152';
            break;
        }
        case 1.5:
        case 1:
        case 0.5: {
            backgroundColor = '#F22E30';
            break;
        }
        default: {
            backgroundColor = '#A6A5A6';
            break;
        }
    }
    return (
        <div className="dirty-dozen-score-container">
            <div className="dirty-dozen-score" style={{ backgroundColor }}>
                {value}
            </div>
        </div>
    );
};

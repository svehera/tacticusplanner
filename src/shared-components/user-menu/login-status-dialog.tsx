import React from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

interface Props {
    onContinue: () => void;
    onClose: () => void;
    onRegister: () => void;
    onLogin: () => void;
}

export const LoginStatusDialog: React.FC<Props> = ({ onContinue, onClose, onRegister, onLogin }) => {
    const { t } = useTranslation();

    return (
        <Dialog open={true} onClose={onClose} fullWidth>
            <DialogTitle>{t('auth.notLoggedIn.title')}</DialogTitle>
            <DialogContent>
                <h3></h3>
                <p>
                    <span style={{ fontWeight: 'bold' }}>{t('auth.notLoggedIn.useWithoutAccount')}</span>{' '}
                    {t('auth.notLoggedIn.continueExplanation')}
                </p>
                <p>
                    <span style={{ fontWeight: 'bold' }}>{t('common.register')}</span>{' '}
                    {t('auth.notLoggedIn.registerExplanation')}
                </p>
                <p>
                    <span style={{ fontWeight: 'bold' }}>{t('common.login')}</span>{' '}
                    {t('auth.notLoggedIn.loginExplanation')}
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onContinue}>{t('auth.notLoggedIn.useWithoutAccount')}</Button>
                <Button onClick={onRegister}>{t('common.register')}</Button>
                <Button onClick={onLogin}>{t('common.login')}</Button>
            </DialogActions>
        </Dialog>
    );
};

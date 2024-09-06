import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Button,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
    open: boolean
    close(): void
}

export default function PaperLibraryWindow(props: Props) {
    const { t } = useTranslation()

    return (
        <Dialog open={props.open} onClose={props.close} fullWidth maxWidth="md">
            <DialogTitle>{t('My Paper Library')}</DialogTitle>
            <DialogContent>
                {/* Add content here in the future */}
                <p>This is the My Paper Library window. Content will be added soon.</p>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('Close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
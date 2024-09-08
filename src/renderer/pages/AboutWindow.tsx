import React from 'react'
import {
    Button,
    Box,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Typography,
    Link,
    Paper,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import platform from '../packages/platform'
import useVersion from '../hooks/useVersion'
import { useAtomValue } from 'jotai'
import * as atoms from '../stores/atoms'
import GitHubIcon from '@mui/icons-material/GitHub'
import PersonIcon from '@mui/icons-material/Person'

interface Props {
    open: boolean
    close(): void
}

export default function AboutWindow(props: Props) {
    const { t } = useTranslation()
    const language = useAtomValue(atoms.languageAtom)
    const { version } = useVersion()

    return (
        <Dialog open={props.open} onClose={props.close} fullWidth maxWidth="sm">
            <DialogTitle>{t('About ChatResearch')}</DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', padding: '20px' }}>
                    <Typography variant="h4" gutterBottom>
                        ChatResearch
                        {version && ` (v${version})`}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        {t('AI-Powered Research Assistant for Scholars')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {t('ChatResearch allows users to chat with AI, build a paper library, and discuss papers with AI. It\'s designed for journal research students and experienced scholars.')}
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('Features')}:
                    </Typography>
                    <ul>
                        <li>{t('AI-powered chat for research discussions')}</li>
                        <li>{t('Paper library management')}</li>
                        <li>{t('AI-assisted paper analysis and discussion')}</li>
                    </ul>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<GitHubIcon />}
                        onClick={() => platform.openLink('https://github.com/yueyueL/ResearchChat')}
                    >
                        GitHub
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PersonIcon />}
                        onClick={() => platform.openLink('https://yueyuel.github.io')}
                    >
                        {t('Personal Page')}
                    </Button>
                </Box>

                <Typography variant="body2" align="center">
                    {t('Developed by')} <Link href="https://yueyuel.github.io" target="_blank" rel="noopener">Knox</Link>
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('Close')}</Button>
            </DialogActions>
        </Dialog>
    )
}

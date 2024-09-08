import React, { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Autocomplete,
    TextField,
    Chip,
    Typography,
    CircularProgress,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Paper } from '../../shared/types'
import * as paperActions from '../stores/paperActions'

interface Props {
    open: boolean
    onClose: () => void
    papers: Paper[]
    allTags: string[]
    onImportComplete: (importedCount: number, newCount: number, newTags: string[]) => void
}

export default function ImportPapersDialog({ open, onClose, papers, allTags, onImportComplete }: Props) {
    const { t } = useTranslation()
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [isImporting, setIsImporting] = useState(false)

    const handleImport = async () => {
        setIsImporting(true)
        try {
            const { importedPapers, newPapers } = await paperActions.importPapers(papers)
            if (selectedTags.length > 0) {
                await paperActions.addTagsToPapers(
                    importedPapers.map(paper => paper.id!),
                    selectedTags
                )
            }
            onImportComplete(importedPapers.length, newPapers.length, selectedTags)
            onClose()
        } catch (error) {
            console.error('Error importing papers:', error)
            // Handle error (e.g., show an error message to the user)
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('Import Papers')}</DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    {t('Importing {{count}} papers', { count: papers.length })}
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={allTags}
                    renderTags={(value: string[], getTagProps) =>
                        value.map((option: string, index: number) => (
                            <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                        ))
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            label={t('Select or create tags')}
                            placeholder={t('Type to add new tag') || ''}
                            helperText={t('Press "Enter" to confirm creating a new tag')}
                        />
                    )}
                    value={selectedTags}
                    onChange={(_, newValue) => setSelectedTags(newValue)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isImporting}>{t('Cancel')}</Button>
                <Button onClick={handleImport} color="primary" disabled={isImporting}>
                    {isImporting ? <CircularProgress size={24} /> : t('Import')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
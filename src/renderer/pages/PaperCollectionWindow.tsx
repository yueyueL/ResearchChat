import React, { useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { papersAtom } from '../stores/atoms'
import * as paperActions from '../stores/paperActions'
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Button,
    Typography,
    Box,
    TextField,
    Grid,
    Paper,
    Tabs,
    Tab,
    IconButton,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import SearchIcon from '@mui/icons-material/Search'
import LinkIcon from '@mui/icons-material/Link'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { Paper as PaperType } from '../../shared/types'
import LibraryStats from '../components/LibraryStats'

interface Props {
    open: boolean
    close(): void
}

export default function PaperCollectionWindow(props: Props) {
    const { t } = useTranslation()
    const [, setPapers] = useAtom(papersAtom)
    const [activeTab, setActiveTab] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [dblpLink, setDblpLink] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadStatus, setUploadStatus] = useState<string>('')

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue)
    }

    const handleSearch = () => {
        console.log('Searching for:', searchQuery)
        // Implement search functionality here
    }

    const handleAddByDblp = () => {
        console.log('Adding paper by DBLP link:', dblpLink)
        // Implement DBLP link addition here
    }

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null
        setSelectedFile(file)
        setUploadStatus('')
    }, [])

    const processUploadedFile = useCallback(async () => {
        if (!selectedFile) {
            setUploadStatus(t('No file selected') || 'No file selected')
            return
        }

        try {
            const fileContent = await selectedFile.text()
            const parsedData = JSON.parse(fileContent)

            if (!Array.isArray(parsedData)) {
                setUploadStatus(t('Invalid file format. Expected an array of papers.') || 'Invalid file format. Expected an array of papers.')
                return
            }

            const { importedPapers, newPapers } = await paperActions.importPapers(parsedData)
            setPapers(await paperActions.fetchAllPapers())
            setUploadStatus(t('Imported {{total}} papers ({{new}} new)', { total: importedPapers.length, new: newPapers.length }) || `Imported ${importedPapers.length} papers (${newPapers.length} new)`)
            setSelectedFile(null)
        } catch (error) {
            console.error('Error processing file:', error)
            setUploadStatus(t('Error processing file. Please check the file format.') || 'Error processing file. Please check the file format.')
        }
    }, [selectedFile, setPapers, t])

    return (
        <Dialog open={props.open} onClose={props.close} fullWidth maxWidth="md">
            <DialogTitle>{t('Paper Collection')}</DialogTitle>
            <DialogContent>
                <LibraryStats />



                <Paper elevation={3} sx={{ mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                        <Tab icon={<SearchIcon />} label={t('Search Semantic Scholar')} />
                        <Tab icon={<LinkIcon />} label={t('Add by DBLP Link')} />
                        <Tab icon={<FileUploadIcon />} label={t('Upload File')} />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {activeTab === 0 && (
                            <Box>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder={t('Search papers...') || ''}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton onClick={handleSearch}>
                                                <SearchIcon />
                                            </IconButton>
                                        ),
                                    }}
                                />
                            </Box>
                        )}
                        {activeTab === 1 && (
                            <Box>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder={t('Enter DBLP link...') || ''}
                                    value={dblpLink}
                                    onChange={(e) => setDblpLink(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton onClick={handleAddByDblp}>
                                                <LinkIcon />
                                            </IconButton>
                                        ),
                                    }}
                                />
                            </Box>
                        )}
                        {activeTab === 2 && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {t('Export paper from Zotero: Open Zotero -> Select paper -> Right-click -> Choose \'Export Items\' -> Select \'CSL JSON\' format')}
                                </Typography>
                                <input
                                    accept="application/json"
                                    style={{ display: 'none' }}
                                    id="raised-button-file"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button variant="contained" component="span" startIcon={<FileUploadIcon />}>
                                        {selectedFile ? selectedFile.name : t('Upload JSON')}
                                    </Button>
                                </label>
                                {selectedFile && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={processUploadedFile}
                                        sx={{ ml: 2 }}
                                    >
                                        {t('Process File')}
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>
                </Paper>

                <Typography variant="h6" sx={{ mb: 2 }}>{t('Recent Papers')}</Typography>
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2">{t('No recent papers')}</Typography>
                </Paper>
                {uploadStatus && (
                    <Typography color={uploadStatus.includes('Error') ? 'error' : 'success'}>
                        {uploadStatus}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('Close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
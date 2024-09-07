import React, { useState, useCallback, useMemo, useEffect } from 'react'
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
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Snackbar,
    LinearProgress,
    CircularProgress,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import SearchIcon from '@mui/icons-material/Search'
import LinkIcon from '@mui/icons-material/Link'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { Paper as PaperType } from '../../shared/types'
import LibraryStats from '../components/LibraryStats'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import paperConstants from '../../shared/paperConstants.json'
import { validateDblpLink, extractPapersFromDblpPage } from '../lib/dblpUtils'

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

    const [domain, setDomain] = useState('')
    const [rank, setRank] = useState('')
    const [type, setType] = useState('')
    const [selectedVenue, setSelectedVenue] = useState('')
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
    const [volumeNumber, setVolumeNumber] = useState<string>('')
    const [dblpLinkError, setDblpLinkError] = useState<string | null>(null)
    const [crawlProgress, setCrawlProgress] = useState<number | null>(null)

    const filteredVenues = useMemo(() => {
        return paperConstants.venues.filter(venue => 
            (!domain || venue.domain === domain) &&
            (!rank || venue.rank === rank) &&
            (!type || venue.type === type)
        )
    }, [domain, rank, type])

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue)
    }

    const handleSearch = () => {
        console.log('Searching for:', searchQuery)
        // Implement search functionality here
    }

    const handleDblpLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newLink = event.target.value;
        setDblpLink(newLink);
        if (newLink && !validateDblpLink(newLink)) {
            setDblpLinkError(t('Please enter a valid DBLP link') || 'Please enter a valid DBLP link');
        } else {
            setDblpLinkError(null);
        }
    }

    const handleAddByDblp = async () => {
        setDblpLinkError(null);
        setCrawlProgress(0);
        const { isValid, error } = await validateDblpLink(dblpLink);
        if (isValid) {
            try {
                const venue = paperConstants.venues.find(v => v.abbreviation === selectedVenue);
                if (!venue) {
                    setDblpLinkError(t('Please select a valid venue'));
                    setCrawlProgress(null);
                    return;
                }

                const year = parseInt(selectedYear, 10);
                if (isNaN(year)) {
                    setDblpLinkError(t('Please enter a valid year'));
                    setCrawlProgress(null);
                    return;
                }

                setCrawlProgress(25);
                const { papers, error: extractionError } = await extractPapersFromDblpPage(dblpLink, venue.fullName, year);
                if (extractionError) {
                    setDblpLinkError(t('Error extracting papers: {{error}}', { error: extractionError }));
                    setCrawlProgress(null);
                    return;
                }
                
                if (papers.length === 0) {
                    setDblpLinkError(t('No papers found on the given DBLP page'));
                    setCrawlProgress(null);
                    return;
                }

                setCrawlProgress(50);
                const { importedPapers, newPapers } = await paperActions.importPapers(papers);
                console.log('Imported papers:', importedPapers);
                console.log('New papers:', newPapers);

                setCrawlProgress(100);
                setDblpLinkError(t('Successfully imported {{count}} papers. {{newCount}} new papers added.', { 
                    count: importedPapers.length, 
                    newCount: newPapers.length 
                }));

                // Clear the DBLP link input
                setDblpLink('');

                // Optionally, update the paper list in the UI here
                setPapers(prevPapers => [...prevPapers, ...newPapers]);

                setTimeout(() => setCrawlProgress(null), 2000); // Hide progress bar after 2 seconds

            } catch (error) {
                console.error('Error processing DBLP page:', error);
                setDblpLinkError(t('Error processing DBLP page. Please try again.'));
                setCrawlProgress(null);
            }
        } else {
            setDblpLinkError(t('Invalid DBLP link: {{error}}', { error: error || 'Unknown error' }));
            setCrawlProgress(null);
        }
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

    const generateDblpLink = useCallback(() => {
        const venue = paperConstants.venues.find(v => v.abbreviation === selectedVenue)
        if (venue) {
            const baseUrl = venue.url.startsWith('http') ? venue.url : `https://${venue.url}`
            const urlParts = baseUrl.split('/')
            const identifier = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] // Get the last non-empty segment

            if (venue.type === 'Conference') {
                const year = selectedYear || new Date().getFullYear().toString()
                return `${baseUrl}${identifier}${year}.html`
            } else if (venue.type === 'Journal') {
                const volume = volumeNumber || '1'  // Default to volume 1 if not specified
                return `${baseUrl}${identifier}${volume}.html`
            }
        }
        return ''
    }, [selectedVenue, selectedYear, volumeNumber])

    useEffect(() => {
        setDblpLink(generateDblpLink())
    }, [generateDblpLink, selectedVenue, selectedYear, volumeNumber])

    const handleYearVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        if (selectedVenue) {
            const venue = paperConstants.venues.find(v => v.abbreviation === selectedVenue)
            if (venue?.type === 'Conference') {
                setSelectedYear(value)
                setVolumeNumber('')  // Clear volume number for conferences
            } else if (venue?.type === 'Journal') {
                setVolumeNumber(value)
                setSelectedYear('')  // Clear year for journals
            }
        }
    }

    const handleVenueChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const selectedAbbreviation = event.target.value as string
        setSelectedVenue(selectedAbbreviation)
        // Reset year/volume when venue changes
        setSelectedYear(new Date().getFullYear().toString())
        setVolumeNumber('')
    }

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
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {t('You can filter venues using the options above or directly paste a DBLP link from the DBLP website.')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, color: 'error.main', fontWeight: 'bold' }}>
                                    {t('Please verify the correctness of the generated URL before crawling, as it may not always be accurate due to varying DBLP rules.')}
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={3}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ mb: 1 }}>{t('Domain')}</InputLabel>
                                            <Select
                                                value={domain}
                                                onChange={(event) => setDomain(event.target.value as string)}
                                                label={t('Domain')}
                                            >
                                                <MenuItem value="">{t('All')}</MenuItem>
                                                {Array.from(new Set(paperConstants.venues.map(v => v.domain))).map(d => (
                                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ mb: 1 }}>{t('Rank')}</InputLabel>
                                            <Select
                                                value={rank}
                                                onChange={(event) => setRank(event.target.value as string)}
                                                label={t('Rank')}
                                            >
                                                <MenuItem value="">{t('All')}</MenuItem>
                                                {['A', 'B', 'C'].map(r => (
                                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ mb: 1 }}>{t('Type')}</InputLabel>
                                            <Select
                                                value={type}
                                                onChange={(event) => setType(event.target.value as string)}
                                                label={t('Type')}
                                            >
                                                <MenuItem value="">{t('All')}</MenuItem>
                                                <MenuItem value="Conference">{t('Conference')}</MenuItem>
                                                <MenuItem value="Journal">{t('Journal')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ mb: 1 }}>{t('Venue')}</InputLabel>
                                            <Select
                                                value={selectedVenue}
                                                onChange={handleVenueChange}
                                                label={t('Venue')}
                                            >
                                                <MenuItem value="">{t('Select Venue')}</MenuItem>
                                                {filteredVenues.map(v => (
                                                    <MenuItem key={v.abbreviation} value={v.abbreviation}>{v.abbreviation}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2} alignItems="flex-end">
                                    <Grid item xs={2}>
                                        <TextField
                                            fullWidth
                                            label={selectedVenue && paperConstants.venues.find(v => v.abbreviation === selectedVenue)?.type === 'Journal' ? t('Volume') : t('Year')}
                                            type="number"
                                            value={selectedVenue && paperConstants.venues.find(v => v.abbreviation === selectedVenue)?.type === 'Journal' ? volumeNumber : selectedYear}
                                            onChange={handleYearVolumeChange}
                                            inputProps={{
                                                min: 1,
                                                max: 9999
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={8}>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            placeholder={t('Enter DBLP link...') || ''}
                                            value={dblpLink}
                                            onChange={handleDblpLinkChange}
                                            error={!!dblpLinkError}
                                            helperText={dblpLinkError}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleAddByDblp}
                                            fullWidth
                                            disabled={crawlProgress !== null}
                                        >
                                            {crawlProgress !== null ? (
                                                <CircularProgress size={24} color="inherit" />
                                            ) : (
                                                t('Crawl & Add')
                                            )}
                                        </Button>
                                    </Grid>
                                </Grid>
                                {crawlProgress !== null && (
                                    <Grid item xs={12}>
                                        <Box sx={{ width: '100%', mt: 2 }}>
                                            <LinearProgress variant="determinate" value={crawlProgress} />
                                        </Box>
                                    </Grid>
                                )}
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
            <Snackbar open={!!dblpLinkError} autoHideDuration={6000} onClose={() => setDblpLinkError(null)}>
                <Alert onClose={() => setDblpLinkError(null)} severity="error" sx={{ width: '100%' }}>
                    {dblpLinkError}
                </Alert>
            </Snackbar>
        </Dialog>
    )
}
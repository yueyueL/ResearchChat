import React, { useState, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { papersAtom, initializePapersAtom } from '../stores/atoms'
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
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Pagination,
    SelectChangeEvent,
    Checkbox,
    Chip,
    Autocomplete,
    InputAdornment,
    FormGroup,
    FormControlLabel,
    RadioGroup,
    Radio,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import { FixedSizeList as List } from 'react-window'
import { Paper as PaperType, Tag } from '../../shared/types'
import AddIcon from '@mui/icons-material/Add';
import LibraryStats from '../components/LibraryStats'
import { 
    ExportAttribute, 
    formatPaperForExport, 
    exportPapersAsString, 
    exportPapersAsJson, 
    copyToClipboard, 
    downloadAsFile 
} from '../lib/exportUtils'
import paperConstants from '../../shared/paperConstants.json'

interface Props {
    open: boolean
    close(): void
}

export default function PaperLibraryWindow(props: Props) {
    const { t } = useTranslation()
    const [, setPapers] = useAtom(papersAtom)
    const [, initializePapers] = useAtom(initializePapersAtom)
    const [searchQuery, setSearchQuery] = useState('')
    const [venueFilter, setVenueFilter] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalPapers, setTotalPapers] = useState(0)
    const [displayLimit, setDisplayLimit] = useState(20)
    const [currentPage, setCurrentPage] = useState(1)
    const [displayedPapers, setDisplayedPapers] = useState<PaperType[]>([])
    const [yearFilterStart, setYearFilterStart] = useState<string>('')
    const [yearFilterEnd, setYearFilterEnd] = useState<string>('')
    const [tagFilter, setTagFilter] = useState<string[]>([])
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [selectedPapers, setSelectedPapers] = useState<number[]>([])
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [isAllSelected, setIsAllSelected] = useState(false)
    const [exportAttributes, setExportAttributes] = useState<ExportAttribute[]>(['title', 'authors', 'year'])
    const [exportType, setExportType] = useState<'clipboard' | 'txt' | 'json'>('clipboard')
    const [exportDialogOpen, setExportDialogOpen] = useState(false)

    const matchVenue = useCallback((paper: PaperType, venueFilter: string) => {
        const lowercaseFilter = venueFilter.toLowerCase();
        if (paper.venue.toLowerCase().includes(lowercaseFilter)) {
            return true;
        }
        // Check if the venue matches any abbreviation
        return paperConstants.venues.some(venue => 
            venue.abbreviation.toLowerCase() === lowercaseFilter &&
            paper.venue.toLowerCase().includes(venue.fullName.toLowerCase())
        );
    }, []);

    useEffect(() => {
        const loadPapers = async () => {
            try {
                setIsLoading(true)
                await initializePapers()
                const { papers, total } = await paperActions.fetchPapersPaginated(
                    currentPage, 
                    displayLimit, 
                    searchQuery, 
                    { start: yearFilterStart, end: yearFilterEnd },
                    venueFilter,
                    tagFilter
                )
                setDisplayedPapers(papers)
                setTotalPapers(total)

                const tags = await paperActions.getAllTags()
                setAllTags(tags)

                setIsLoading(false)
            } catch (err) {
                console.error('Failed to initialize papers:', err)
                setError(`Failed to load papers. Error: ${err instanceof Error ? err.message : String(err)}`)
                setIsLoading(false)
            }
        }
        loadPapers()
    }, [initializePapers, currentPage, displayLimit, searchQuery, yearFilterStart, yearFilterEnd, venueFilter, tagFilter])

    const handleSearch = () => {
        setCurrentPage(1)
    }

    const handleVenueFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVenueFilter = event.target.value;
        setVenueFilter(newVenueFilter);
        setCurrentPage(1);
    }

    const handleDisplayLimitChange = (event: SelectChangeEvent<number>) => {
        setDisplayLimit(Number(event.target.value))
        setCurrentPage(1)
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value)
    }

    const handleClearLibrary = async () => {
        if (window.confirm(t('Are you sure you want to clear your entire paper library?') || 'Are you sure you want to clear your entire paper library?')) {
            try {
                await paperActions.clearAllPapers()
                setPapers([])
                setDisplayedPapers([])
                setTotalPapers(0)
            } catch (err) {
                console.error('Failed to clear library:', err)
                setError(`Failed to clear library. Error: ${err instanceof Error ? err.message : String(err)}`)
            }
        }
    }

    const handleYearFilterStart = (event: React.ChangeEvent<HTMLInputElement>) => {
        setYearFilterStart(event.target.value)
        setCurrentPage(1)
    }

    const handleYearFilterEnd = (event: React.ChangeEvent<HTMLInputElement>) => {
        setYearFilterEnd(event.target.value)
        setCurrentPage(1)
    }

    const handleTagFilterChange = (event: React.SyntheticEvent, newValue: string[]) => {
        setTagFilter(newValue)
        setCurrentPage(1)
    }

    const handleSelectPaper = (paperId: number) => {
        setSelectedPapers(prev => 
            prev.includes(paperId) ? prev.filter(id => id !== paperId) : [...prev, paperId]
        )
    }

    const handleSelectAll = useCallback(async () => {
        if (isAllSelected) {
            setSelectedPapers([])
            setIsAllSelected(false)
        } else {
            try {
                const allPaperIds = await paperActions.getAllPaperIds(
                    searchQuery,
                    { start: yearFilterStart, end: yearFilterEnd },
                    venueFilter,
                    tagFilter
                )
                setSelectedPapers(allPaperIds)
                setIsAllSelected(true)
            } catch (error) {
                console.error('Error selecting all papers:', error)
                setError(`Failed to select all papers. Error: ${error instanceof Error ? error.message : String(error)}`)
            }
        }
    }, [isAllSelected, searchQuery, yearFilterStart, yearFilterEnd, venueFilter, tagFilter])

    useEffect(() => {
        // Reset isAllSelected when filters change
        setIsAllSelected(false)
    }, [searchQuery, yearFilterStart, yearFilterEnd, venueFilter, tagFilter])

    const handleTagSelection = (event: React.SyntheticEvent, value: string | null) => {
        setSelectedTag(value)
    }

    const handleAddTag = async () => {
        if (selectedTag && selectedPapers.length > 0) {
            try {
                if (!allTags.some(tag => tag.name === selectedTag)) {
                    // If it's a new tag, create it first
                    await paperActions.createTag(selectedTag)
                }
                await paperActions.addTagsToPapers(selectedPapers, [selectedTag])
                setSelectedPapers([])
                setSelectedTag(null)
                await refreshPapers()
            } catch (error) {
                console.error('Error adding tag:', error)
                setError(`Failed to add tag. Error: ${error instanceof Error ? error.message : String(error)}`)
            }
        }
    }

    const refreshPapers = useCallback(async () => {
        try {
            const { papers, total } = await paperActions.fetchPapersPaginated(
                currentPage, 
                displayLimit, 
                searchQuery, 
                { start: yearFilterStart, end: yearFilterEnd },
                venueFilter,
                tagFilter
            )
            // Filter papers based on venue (including abbreviations)
            const filteredPapers = venueFilter
                ? papers.filter(paper => matchVenue(paper, venueFilter))
                : papers;
            setDisplayedPapers(filteredPapers);
            setTotalPapers(total);
            const tags = await paperActions.getAllTags();
            setAllTags(tags);
        } catch (error) {
            console.error('Error refreshing papers:', error);
            setError(`Failed to refresh papers. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [currentPage, displayLimit, searchQuery, yearFilterStart, yearFilterEnd, venueFilter, tagFilter, matchVenue]);

    useEffect(() => {
        refreshPapers()
    }, [refreshPapers])

    const handleDeleteTag = async (tagId: number) => {
        try {
            await paperActions.deleteTag(tagId)
            await refreshPapers()
        } catch (error) {
            console.error('Error deleting tag:', error)
            setError(`Failed to delete tag. Error: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    const handleRemoveTagFromPaper = async (paperId: number, tag: string) => {
        try {
            await paperActions.removeTagsFromPapers([paperId], [tag])
            await refreshPapers()
        } catch (error) {
            console.error('Error removing tag from paper:', error)
            setError(`Failed to remove tag from paper. Error: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    const handleDeleteSelectedPapers = async () => {
        if (selectedPapers.length === 0) return;

        const confirmDelete = window.confirm(t('Are you sure you want to delete the selected papers?') || '');
        if (!confirmDelete) return;

        try {
            await paperActions.deletePapers(selectedPapers);
            setSelectedPapers([]);
            await refreshPapers();
        } catch (error) {
            console.error('Error deleting papers:', error);
            setError(`Failed to delete papers. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    const handleExportAttributeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const attribute = event.target.name as ExportAttribute
        setExportAttributes(prev => 
            event.target.checked
                ? [...prev, attribute]
                : prev.filter(attr => attr !== attribute)
        )
    }

    const handleExportTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExportType(event.target.value as 'clipboard' | 'txt' | 'json')
    }

    const handleExport = async () => {
        const selectedPapersData = displayedPapers.filter(paper => selectedPapers.includes(paper.id!))
        let exportContent: string

        if (exportType === 'json') {
            exportContent = exportPapersAsJson(selectedPapersData, exportAttributes)
        } else {
            exportContent = exportPapersAsString(selectedPapersData, exportAttributes)
        }

        try {
            if (exportType === 'clipboard') {
                await copyToClipboard(exportContent)
                // Show a success message
            } else {
                const fileName = `exported_papers.${exportType}`
                const fileType = exportType === 'json' ? 'application/json' : 'text/plain'
                downloadAsFile(exportContent, fileName, fileType)
            }
            setExportDialogOpen(false)
        } catch (error) {
            console.error('Export failed:', error)
            setError(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    const PaperRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const paper = displayedPapers[index]
        
        const handleTitleClick = () => {
            if (paper.url) {
                // Use window.open instead of shell.openExternal
                window.open(paper.url, '_blank', 'noopener,noreferrer')
            }
        }

        return (
            <Paper key={paper.id} elevation={2} style={{ ...style, display: 'flex', alignItems: 'center' }}>
                <Checkbox
                    checked={selectedPapers.includes(paper.id!)}
                    onChange={() => handleSelectPaper(paper.id!)}
                    sx={{ mr: 2 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                        variant="h6" 
                        onClick={handleTitleClick}
                        sx={{
                            cursor: paper.url ? 'pointer' : 'default',
                            '&:hover': {
                                textDecoration: paper.url ? 'underline' : 'none',
                            },
                            color: paper.url ? 'primary.main' : 'text.primary',
                        }}
                    >
                        {paper.title}
                    </Typography>
                    <Typography variant="body2">{paper.authors.join(', ')}</Typography>
                    <Typography variant="body2">{paper.year} - {paper.venue}</Typography>
                    {Array.isArray(paper.tags) && paper.tags.map(tag => (
                        <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            onDelete={() => handleRemoveTagFromPaper(paper.id!, tag)}
                            style={{ margin: '2px' }} 
                        />
                    ))}
                </Box>
            </Paper>
        )
    }

    const pageCount = Math.ceil(totalPapers / displayLimit)

    useEffect(() => {
        if (props.open) {
            refreshPapers();
        }
    }, [props.open, refreshPapers]);

    return (
        <Dialog open={props.open} onClose={props.close} fullWidth maxWidth="md" classes={{ paper: 'h-4/5' }}>
            <DialogTitle>{t('My Paper Library')}</DialogTitle>
            <DialogContent>
                <LibraryStats />

                <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        {/* First Line */}
                        <Grid item xs={12} sm={6}>
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
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label={t('Year Start')}
                                type="number"
                                value={yearFilterStart}
                                onChange={handleYearFilterStart}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label={t('Year End')}
                                type="number"
                                value={yearFilterEnd}
                                onChange={handleYearFilterEnd}
                            />
                        </Grid>

                        {/* Second Line */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label={t('Venue')}
                                value={venueFilter}
                                onChange={handleVenueFilter}
                                placeholder={t('Enter venue name or abbreviation') || ''}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <Autocomplete
                                multiple
                                options={allTags.map(tag => tag.name)}
                                value={tagFilter}
                                onChange={handleTagFilterChange}
                                renderInput={(params) => (
                                    <TextField {...params} label={t('Filter by Tags')} placeholder={t('Select tags') || ''} />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                                <InputLabel>{t('Display')}</InputLabel>
                                <Select
                                    value={displayLimit}
                                    onChange={handleDisplayLimitChange}
                                    label={t('Display')}
                                >
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={20}>20</MenuItem>
                                    <MenuItem value={30}>30</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{t('Paper List')}</Typography>
                    <Typography variant="subtitle1">
                        {t('Showing {{count}} of {{total}} papers', { count: displayedPapers.length, total: totalPapers })}
                    </Typography>
                </Box>

                <Box sx={{ height: 400, width: '100%' }}>
                    <List
                        height={400}
                        itemCount={displayedPapers.length}
                        itemSize={100}
                        width="100%"
                    >
                        {PaperRow}
                    </List>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                        count={pageCount} 
                        page={currentPage} 
                        onChange={handlePageChange} 
                        color="primary" 
                    />
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleSelectAll}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {isAllSelected ? t('Deselect All') : t('Select All')}
                    </Button>
                    <Autocomplete
                        freeSolo
                        options={allTags.map(tag => tag.name)}
                        renderInput={(params) => <TextField {...params} label={t('Select or create tag')} />}
                        value={selectedTag}
                        onChange={handleTagSelection}
                        onInputChange={(event, newInputValue) => {
                            setSelectedTag(newInputValue)
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAddTag} 
                        disabled={!selectedTag || selectedPapers.length === 0}
                        startIcon={<AddIcon />}
                    >
                        {t('Add Tag')}
                    </Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={handleDeleteSelectedPapers} 
                        disabled={selectedPapers.length === 0}
                        startIcon={<DeleteIcon />}
                    >
                        {t('Delete Selected')}
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={() => setExportDialogOpen(true)} 
                        disabled={selectedPapers.length === 0}
                    >
                        {t('Export Selected')}
                    </Button>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">{t('Manage Tags')}</Typography>
                    {allTags.map(tag => (
                        <Chip
                            key={tag.id}
                            label={tag.name}
                            onDelete={() => handleDeleteTag(tag.id!)}
                            style={{ margin: '2px' }}
                        />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClearLibrary}
                    startIcon={<DeleteIcon />}
                    color="error"
                >
                    {t('Clear Library')}
                </Button>
                <Button onClick={props.close}>{t('Close')}</Button>
            </DialogActions>

            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
                <DialogTitle>{t('Export Papers')}</DialogTitle>
                <DialogContent>
                    <FormGroup>
                        <Typography variant="subtitle1">{t('Select attributes to export:')}</Typography>
                        {(['title', 'authors', 'year', 'venue', 'url', 'abstract', 'doi'] as ExportAttribute[]).map(attr => (
                            <FormControlLabel
                                key={attr}
                                control={
                                    <Checkbox
                                        checked={exportAttributes.includes(attr)}
                                        onChange={handleExportAttributeChange}
                                        name={attr}
                                    />
                                }
                                label={t(attr.charAt(0).toUpperCase() + attr.slice(1))}
                            />
                        ))}
                    </FormGroup>
                    <RadioGroup
                        value={exportType}
                        onChange={handleExportTypeChange}
                    >
                        <FormControlLabel value="clipboard" control={<Radio />} label={t('Copy to Clipboard')} />
                        <FormControlLabel value="txt" control={<Radio />} label={t('Export as TXT')} />
                        <FormControlLabel value="json" control={<Radio />} label={t('Export as JSON')} />
                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>{t('Cancel')}</Button>
                    <Button onClick={handleExport} variant="contained">{t('Export')}</Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    )
}
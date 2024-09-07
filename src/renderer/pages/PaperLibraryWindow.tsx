import React, { useState, useEffect } from 'react'
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
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import { FixedSizeList as List } from 'react-window'
import { Paper as PaperType } from '../../shared/types'

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
                    venueFilter
                )
                setDisplayedPapers(papers)
                setTotalPapers(total)
                setIsLoading(false)
            } catch (err) {
                console.error('Failed to initialize papers:', err)
                setError(`Failed to load papers. Error: ${err instanceof Error ? err.message : String(err)}`)
                setIsLoading(false)
            }
        }
        loadPapers()
    }, [initializePapers, currentPage, displayLimit, searchQuery, yearFilterStart, yearFilterEnd, venueFilter])

    const handleSearch = () => {
        setCurrentPage(1)
    }

    const handleVenueFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
        setVenueFilter(event.target.value)
        setCurrentPage(1)
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

    const PaperRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const paper = displayedPapers[index]
        return (
            <Paper key={paper.id} elevation={2} style={style}>
                <Typography variant="h6">{paper.title}</Typography>
                <Typography variant="body2">{paper.authors.join(', ')}</Typography>
                <Typography variant="body2">{paper.year} - {paper.venue}</Typography>
            </Paper>
        )
    }

    const pageCount = Math.ceil(totalPapers / displayLimit)

    return (
        <Dialog open={props.open} onClose={props.close} fullWidth maxWidth="md" classes={{ paper: 'h-4/5' }}>
            <DialogTitle>{t('My Paper Library')}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Typography variant="body1">
                                <strong>{t('Total Papers')}:</strong> {totalPapers}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body1">
                                <strong>{t('Filtered Papers')}:</strong> {displayedPapers.length}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body1">
                                <strong>{t('Year Range')}:</strong> {yearFilterStart || 'Any'} - {yearFilterEnd || 'Any'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={t('Venue')}
                                value={venueFilter}
                                onChange={handleVenueFilter}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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

                <Typography variant="h6" sx={{ mb: 2 }}>{t('Paper List')}</Typography>
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
        </Dialog>
    )
}
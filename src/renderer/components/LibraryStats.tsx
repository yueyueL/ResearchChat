import React, { useEffect, useState } from 'react'
import { Typography, Grid, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as paperActions from '../stores/paperActions'

interface LibraryStatsProps {
    className?: string
}

export default function LibraryStats({ className }: LibraryStatsProps) {
    const { t } = useTranslation()
    const [totalPapers, setTotalPapers] = useState(0)
    const [totalTags, setTotalTags] = useState(0)
    const [librarySize, setLibrarySize] = useState(0)

    useEffect(() => {
        const fetchLibraryStats = async () => {
            const papers = await paperActions.fetchAllPapers()
            setTotalPapers(papers.length)

            const tags = await paperActions.getAllTags()
            setTotalTags(tags.length)

            const sizeInBytes = await paperActions.getLibrarySize()
            const sizeInMB = sizeInBytes / (1024 * 1024)
            setLibrarySize(sizeInMB)
        }

        fetchLibraryStats()
    }, [])

    return (
        <Box className={className} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <Typography variant="body1">
                        <strong>{t('Total Papers')}:</strong> {totalPapers}
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="body1">
                        <strong>{t('Total Tags')}:</strong> {totalTags}
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="body1">
                        <strong>{t('Library Size')}:</strong> {librarySize.toFixed(2)} MB
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    )
}
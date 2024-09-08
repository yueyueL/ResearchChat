import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Grid, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { searchArxiv } from '../lib/arxivUtils';
import { Paper } from '../../shared/types';
import paperConstants from '../../shared/paperConstants.json';

interface ArxivSearchProps {
  onSearchComplete: (papers: Paper[]) => void;
}

type DateRange = 'custom' | 'week' | 'twoWeeks' | 'month' | 'threeMonths' | 'halfYear' | 'year';

export default function ArxivSearch({ onSearchComplete }: ArxivSearchProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('custom');
  const [selectedCategory, setSelectedCategory] = useState('');

  const updateDates = useCallback(() => {
    if (dateRange !== 'custom') {
      const end = new Date();
      let start = new Date();
      switch (dateRange) {
        case 'week':
          start.setDate(end.getDate() - 7);
          break;
        case 'twoWeeks':
          start.setDate(end.getDate() - 14);
          break;
        case 'month':
          start.setMonth(end.getMonth() - 1);
          break;
        case 'threeMonths':
          start.setMonth(end.getMonth() - 3);
          break;
        case 'halfYear':
          start.setMonth(end.getMonth() - 6);
          break;
        case 'year':
          start.setFullYear(end.getFullYear() - 1);
          break;
      }
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [dateRange]);

  useEffect(() => {
    updateDates();
  }, [updateDates]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      console.log('Search parameters:', { searchQuery, startDate, endDate, maxResults, selectedCategory });
      const { papers } = await searchArxiv({
        searchQuery,
        startDate,
        endDate,
        maxResults,
        start: 0,
        category: selectedCategory,
      });
      console.log('Search completed, papers found:', papers.length);
      onSearchComplete(papers);
    } catch (error) {
      console.error('Error searching arXiv:', error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label={t('Search Query')}
          placeholder={t('Enter keywords to search in title and abstract') as string}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>{t('Date Range')}</InputLabel>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            label={t('Date Range')}
          >
            <MenuItem value="custom">{t('Custom')}</MenuItem>
            <MenuItem value="week">{t('Past Week')}</MenuItem>
            <MenuItem value="twoWeeks">{t('Past Two Weeks')}</MenuItem>
            <MenuItem value="month">{t('Past Month')}</MenuItem>
            <MenuItem value="threeMonths">{t('Past Three Months')}</MenuItem>
            <MenuItem value="halfYear">{t('Past Six Months')}</MenuItem>
            <MenuItem value="year">{t('Past Year')}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label={t('Start Date')}
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setDateRange('custom');
          }}
          InputLabelProps={{ shrink: true }}
          disabled={dateRange !== 'custom'}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label={t('End Date')}
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setDateRange('custom');
          }}
          InputLabelProps={{ shrink: true }}
          disabled={dateRange !== 'custom'}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label={t('Max Results')}
          type="number"
          value={maxResults}
          onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
          InputProps={{ inputProps: { min: 1, max: 100 } }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>{t('Category')}</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as string)}
            label={t('Category')}
          >
            <MenuItem value="">{t('All Categories')}</MenuItem>
            {Object.entries(paperConstants.arXiv).map(([key, value]) => (
              <MenuItem key={key} value={key}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={isSearching}
          fullWidth
        >
          {isSearching ? <CircularProgress size={24} /> : t('Search arXiv')}
        </Button>
      </Grid>
    </Grid>
  );
}
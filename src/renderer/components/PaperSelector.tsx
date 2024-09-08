import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Chip, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Checkbox, 
    ListItemText, 
    OutlinedInput,
    Button,
    Typography,
    TextField,
    SelectChangeEvent,
    Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as paperActions from '../stores/paperActions';
import { Paper } from '../../shared/types';

interface PaperSelectorProps {
    onPaperInfoSelected: (paperInfo: string) => void;
}

const paperInfoOptions = ['title', 'year', 'venue', 'authors', 'abstract'];
const presetLimits = [10, 20, 50, 100, 200, 'all'];

export default function PaperSelector({ onPaperInfoSelected }: PaperSelectorProps) {
    const { t } = useTranslation();
    const [allTags, setAllTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
    const [selectedInfo, setSelectedInfo] = useState<string[]>([]);
    const [paperLimit, setPaperLimit] = useState<number | 'all'>(10);
    const [customLimit, setCustomLimit] = useState<string>('');
    const [totalPapers, setTotalPapers] = useState<number>(0);
    const [wordCount, setWordCount] = useState<number>(0);
    const [infoSize, setInfoSize] = useState<number>(0);

    useEffect(() => {
        const loadTags = async () => {
            const tags = await paperActions.getAllTags();
            setAllTags(tags.map(tag => tag.name));
        };
        loadTags();
    }, []);

    const handleTagChange = async (event: SelectChangeEvent<string[]>) => {
        const tags = event.target.value as string[];
        setSelectedTags(tags);
        const papers = await refreshPapers(tags);
        setTotalPapers(papers.length);
    };

    const refreshPapers = async (tags: string[]): Promise<Paper[]> => {
        const papers = await paperActions.filterPapers({ tags });
        if (paperLimit === 'all') {
            setSelectedPapers(papers);
        } else {
            setSelectedPapers(papers.slice(0, paperLimit));
        }
        return papers;
    };

    const handleInfoChange = (event: SelectChangeEvent<string[]>) => {
        setSelectedInfo(event.target.value as string[]);
        updateWordCountAndSize(selectedPapers, event.target.value as string[]);
    };

    const handleLimitChange = async (event: SelectChangeEvent<number | string>) => {
        const value = event.target.value;
        if (value === 'all') {
            setPaperLimit('all');
            setCustomLimit('');
        } else {
            setPaperLimit(Number(value));
            setCustomLimit(value.toString());
        }
        const papers = await refreshPapers(selectedTags);
        updateWordCountAndSize(papers, selectedInfo);
    };

    const handleCustomLimitChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setCustomLimit(value);
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            setPaperLimit(numValue);
            const papers = await refreshPapers(selectedTags);
            updateWordCountAndSize(papers, selectedInfo);
        }
    };

    const updateWordCountAndSize = (papers: Paper[], info: string[]) => {
        let totalText = '';
        papers.forEach(paper => {
            info.forEach(field => {
                switch (field) {
                    case 'title': totalText += paper.title + ' '; break;
                    case 'year': totalText += paper.year + ' '; break;
                    case 'venue': totalText += paper.venue + ' '; break;
                    case 'authors': totalText += paper.authors.join(', ') + ' '; break;
                    case 'abstract': totalText += paper.abstract + ' '; break;
                }
            });
        });
        setWordCount(totalText.split(/\s+/).filter(word => word.length > 0).length);
        setInfoSize(new Blob([totalText]).size / 1024); // Size in KB
    };

    const handleAddPaperInfo = () => {
        const paperInfo = selectedPapers.map(paper => {
            return selectedInfo.map(info => {
                switch (info) {
                    case 'title': return `Title: ${paper.title}`;
                    case 'year': return `Year: ${paper.year}`;
                    case 'venue': return `Venue: ${paper.venue}`;
                    case 'authors': return `Authors: ${paper.authors.join(', ')}`;
                    case 'abstract': return `Abstract: ${paper.abstract}`;
                    default: return '';
                }
            }).join('\n');
        }).join('\n\n');

        onPaperInfoSelected(paperInfo);
    };

    return (
        <Box>
            <FormControl fullWidth margin="normal">
                <InputLabel>{t('Select Tags')}</InputLabel>
                <Select
                    multiple
                    value={selectedTags}
                    onChange={handleTagChange}
                    input={<OutlinedInput label={t('Select Tags')} />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                >
                    {allTags.map((tag) => (
                        <MenuItem key={tag} value={tag}>
                            <Checkbox checked={selectedTags.indexOf(tag) > -1} />
                            <ListItemText primary={tag} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Typography variant="body2" sx={{ mt: 1 }}>
                {t('Total Papers')}: {totalPapers}
            </Typography>

            <FormControl fullWidth margin="normal">
                <InputLabel>{t('Select Paper Information')}</InputLabel>
                <Select
                    multiple
                    value={selectedInfo}
                    onChange={handleInfoChange}
                    input={<OutlinedInput label={t('Select Paper Information')} />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                >
                    {paperInfoOptions.map((info) => (
                        <MenuItem key={info} value={info}>
                            <Checkbox checked={selectedInfo.indexOf(info) > -1} />
                            <ListItemText primary={t(info)} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel>{t('Number of Papers')}</InputLabel>
                        <Select
                            value={paperLimit}
                            onChange={handleLimitChange}
                            input={<OutlinedInput label={t('Number of Papers')} />}
                        >
                            {presetLimits.map((limit) => (
                                <MenuItem key={limit} value={limit}>{limit}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label={t('Custom Number')}
                        type="number"
                        value={customLimit}
                        onChange={handleCustomLimitChange}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                </Grid>
            </Grid>

            <Typography variant="body2" sx={{ mt: 2 }}>
                {t('Selected Papers')}: {selectedPapers.length}
            </Typography>
            <Typography variant="body2">
                {t('Total Words')}: {wordCount}
            </Typography>
            <Typography variant="body2">
                {t('Total Size')}: {infoSize.toFixed(2)} KB
            </Typography>

            <Button 
                variant="contained" 
                onClick={handleAddPaperInfo} 
                disabled={selectedPapers.length === 0 || selectedInfo.length === 0}
                sx={{ mt: 2 }}
            >
                {t('Add Paper Information to Message')}
            </Button>
        </Box>
    );
}
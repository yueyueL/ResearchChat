import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PaperSelector from './PaperSelector';

export default function ChatInterface() {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<string[]>([]);

    const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            setChatHistory(prev => [...prev, `User: ${message}`]);
            setMessage('');
            // Here you would typically send the message to your chatbot and get a response
        }
    };

    const handlePaperInfoSelected = (paperInfo: string) => {
        setMessage(prev => `${prev}\n\nSelected Paper Information:\n${paperInfo}`);
    };

    return (
        <Box>
            <Box sx={{ height: 400, overflowY: 'auto', mb: 2, p: 2, border: '1px solid #ccc' }}>
                {chatHistory.map((msg, index) => (
                    <Typography key={index}>{msg}</Typography>
                ))}
            </Box>
            <PaperSelector onPaperInfoSelected={handlePaperInfoSelected} />
            <TextField
                fullWidth
                multiline
                rows={4}
                value={message}
                onChange={handleMessageChange}
                placeholder={t('Type your message here...') || ''}
                sx={{ mt: 2 }}
            />
            <Button 
                variant="contained" 
                onClick={handleSendMessage} 
                disabled={!message.trim()} 
                sx={{ mt: 2 }}
            >
                {t('Send')}
            </Button>
        </Box>
    );
}
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';
import api from '../api/axiosConfig';

// Импортируй белый логотип. Укажи правильный путь к картинке bros_logo_white.png в твоем проекте
import logoWhite from '/public/Resources/bros_logo_white.png'; 

const Login = ({ onLoginSuccess }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/Users/loginAdmin', {
                identifier: identifier,
                password: password
            });

            localStorage.setItem('adminUser', JSON.stringify(response.data));
            onLoginSuccess(response.data);
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError("У вас нет прав администратора для входа на этот сайт.");
            } else if (err.response && err.response.status === 401) {
                setError("Неверный логин/email или пароль.");
            } else {
                setError("Произошла ошибка при подключении к серверу.");
            }
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 5, 
                        width: '100%', 
                        borderRadius: '24px', 
                        background: 'var(--card-bg)', 
                        backdropFilter: 'var(--card-blur)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <Box 
                        component="img" 
                        src={logoWhite} 
                        alt="Bro's Shop" 
                        sx={{ width: '150px', mb: 3, objectFit: 'contain' }} 
                    />

                    <Typography 
                        variant="h6" 
                        align="center" 
                        sx={{ 
                            color: 'var(--text-main)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1.5px', 
                            fontWeight: 'bold',
                            mb: 3,
                            fontSize: '1.1rem'
                        }}
                    >
                        Вход в аккаунт
                    </Typography>
                    
                    {error && (
                        <Alert 
                            severity="error" 
                            variant="outlined"
                            sx={{ 
                                mb: 2, 
                                width: '100%',
                                borderRadius: '12px',
                                color: '#ff6b6b',
                                borderColor: 'var(--error-color)',
                                background: 'rgba(255, 74, 74, 0.1)',
                                '& .MuiAlert-icon': { color: '#ff6b6b' }
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                        
                        {/* Поле: Логин или Email */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Логин или Email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            variant="outlined"
                            sx={{
                                // Стили для текста подсказки (Label)
                                '& .MuiInputLabel-root': {
                                    color: 'var(--text-muted)',
                                    '&.Mui-focused': {
                                        color: '#b39ddb', // Мягкий фиолетовый цвет при фокусе
                                    },
                                },
                                // Стили для поля ввода
                                '& .MuiOutlinedInput-root': {
                                    color: '#ffffff', // Чистый белый цвет вводимого текста
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    // Корректное отображение белого текста при автозаполнении браузером
                                    '& input': {
                                        WebkitTextFillColor: '#ffffff !important',
                                    },
                                    '& fieldset': { borderColor: 'var(--border-color)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                                    '&.Mui-focused fieldset': { borderColor: '#b39ddb' }, // Фиолетовая рамка при фокусе
                                },
                            }}
                        />

                        {/* Поле: Пароль */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Пароль"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            sx={{
                                // Стили для текста подсказки (Label)
                                '& .MuiInputLabel-root': {
                                    color: 'var(--text-muted)',
                                    '&.Mui-focused': {
                                        color: '#b39ddb', // Мягкий фиолетовый цвет при фокусе
                                    },
                                },
                                // Стили для поля ввода
                                '& .MuiOutlinedInput-root': {
                                    color: '#ffffff', // Чистый белый цвет вводимого текста
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    '& input': {
                                        WebkitTextFillColor: '#ffffff !important',
                                    },
                                    '& fieldset': { borderColor: 'var(--border-color)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                                    '&.Mui-focused fieldset': { borderColor: '#b39ddb' }, // Фиолетовая рамка при фокусе
                                },
                            }}
                        />

                        <Button 
                            type="submit" 
                            fullWidth 
                            variant="contained" 
                            sx={{ 
                                mt: 4, 
                                mb: 1, 
                                py: 1.8,
                                borderRadius: '14px',
                                backgroundColor: 'var(--accent-button-bg)',
                                color: 'var(--accent-button-text)',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontSize: '0.95rem',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: 'var(--accent-button-hover)',
                                    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
                                }
                            }}
                        >
                            Войти
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
 import React, { useState } from 'react';

import { Box, Typography, Paper, Tabs, Tab, TextField, Button, Alert, Grid } from '@mui/material';

import api from '../api/axiosConfig';



// Общие стили для темных полей ввода

const darkInputStyles = {

    '& .MuiOutlinedInput-root': {

        color: '#fff',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
        '&.Mui-focused fieldset': { borderColor: '#fff' },
        '&.Mui-disabled': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
        }

    },

    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
    '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
    '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.4)', mt: 1 },
    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(255, 255, 255, 0.5)' }

};



// Стили для кастомных уведомлений (Alert)

const alertStyles = {

    borderRadius: '12px',
    border: '1px solid',

    '&.MuiAlert-standardSuccess': {
        backgroundColor: 'rgba(46, 125, 50, 0.15)',
        color: '#66bb6a',
        borderColor: 'rgba(46, 125, 50, 0.3)',
        '& .MuiAlert-icon': { color: '#66bb6a' }
    },

    '&.MuiAlert-standardError': {
        backgroundColor: 'rgba(211, 47, 47, 0.15)',
        color: '#f44336',
        borderColor: 'rgba(211, 47, 47, 0.3)',
        '& .MuiAlert-icon': { color: '#f44336' }
    }

};



const Profile = ({ currentUser, onUserUpdate }) => {

    const [activeTab, setActiveTab] = useState(0);

    // Сообщения об операциях

    const [infoMessage, setInfoMessage] = useState({ text: '', severity: 'success' });

    const [securityMessage, setSecurityMessage] = useState({ text: '', severity: 'success' });



    // Состояния для вкладки "Личные данные"

    const [fullName, setFullName] = useState(currentUser.fullName || '');

    const [login, setLogin] = useState(currentUser.login || '');

    const [email, setEmail] = useState(currentUser.email || '');



    // Состояния для вкладки "Безопасность"

    const [currentPassword, setCurrentPassword] = useState('');

    const [newPassword, setNewPassword] = useState('');

    const [confirmPassword, setConfirmPassword] = useState('');

    const handleTabChange = (event, newValue) => {

        setActiveTab(newValue);

    };

    // Сохранение личной информации

    const handleUpdateInfo = async (e) => {

        e.preventDefault();
        setInfoMessage({ text: '', severity: 'success' });

        try {

            const response = await api.put('/Users/update-profile', {

                userId: currentUser.userId,
                fullName,
                login,
                email
            });
            // Обновляем состояние в App.jsx

            onUserUpdate(response.data);
            setInfoMessage({ text: 'Данные профиля успешно обновлены!', severity: 'success' });

        } catch (err) {

            const errMsg = err.response?.data?.message || 'Ошибка обновления профиля.';
            setInfoMessage({ text: errMsg, severity: 'error' });
        }

    };



    // Смена пароля

    const handleUpdatePassword = async (e) => {

        e.preventDefault();
        setSecurityMessage({ text: '', severity: 'success' });

        if (newPassword !== confirmPassword) {

            setSecurityMessage({ text: 'Новые пароли не совпадают!', severity: 'error' });
            return;
        }

        try {

            await api.put('/Users/change-password', {
                userId: currentUser.userId,
                currentPassword,
                newPassword
            });

            setSecurityMessage({ text: 'Пароль успешно изменен!', severity: 'success' });

            // Очищаем форму после успеха
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (err) {

            const errMsg = err.response?.data?.message || 'Не удалось изменить пароль.';
            setSecurityMessage({ text: errMsg, severity: 'error' });

        }

    };



    return (

        <Box maxWidth="md">

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', mb: 4 }}>
                Личный кабинет
            </Typography>

            <Paper sx={{ width: '100%', backgroundColor: '#111111', borderRadius: '20px', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>

                {/* ВКЛАДКИ */}

                <Tabs

                    value={activeTab}
                    onChange={handleTabChange}
                    TabIndicatorProps={{ style: { backgroundColor: '#fff' } }}
                    sx={{

                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(255,255,255,0.02)',

                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontWeight: '600',
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            py: 2,
                            '&.Mui-selected': { color: '#fff' },
                            '&:hover': { color: 'rgba(255, 255, 255, 0.8)' }
                        }
                    }}

                >
                    <Tab label="Личные данные" sx={{ px: 4 }} />
                    <Tab label="Безопасность и пароль" sx={{ px: 4 }} />
                </Tabs>



                {/* ВКЛАДКА 1: ЛИЧНЫЕ ДАННЫЕ */}

                {activeTab === 0 && (

                    <Box component="form" onSubmit={handleUpdateInfo} sx={{ p: 4 }}>

                        {infoMessage.text && (
                            <Alert severity={infoMessage.severity} sx={{ mb: 4, ...alertStyles }}>{infoMessage.text}</Alert>
                        )}

                        <Grid container spacing={3}>

                            <Grid item xs={12} sm={6}>
                                <TextField

                                    label="ФИО"
                                    fullWidth
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    sx={darkInputStyles}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>

                                <TextField
                                    label="Логин"
                                    required
                                    fullWidth
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    sx={darkInputStyles}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    fullWidth
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    sx={darkInputStyles}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>

                                <TextField
                                    label="Ваша Роль в системе"
                                    disabled
                                    fullWidth
                                    value={currentUser.roleId == 1 ? 'Администратор' : 'Пользователь' || currentUser.roleId == 4 ? 'Гл.Администратор' : 'Пользователь' }
                                    //helperText="Изменение роли доступно только через главного администратора"
                                    sx={darkInputStyles}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 1 }}>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ backgroundColor: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', px: 4, py: 1.2, textTransform: 'none', '&:hover': { backgroundColor: '#e0e0e0' } }}
                                >
                                    Сохранить изменения
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* ВКЛАДКА 2: БЕЗОПАСНОСТЬ (СМЕНА ПАРОЛЯ) */}

                {activeTab === 1 && (

                    <Box component="form" onSubmit={handleUpdatePassword} sx={{ p: 4 }}>

                        {securityMessage.text && (
                            <Alert severity={securityMessage.severity} sx={{ mb: 4, ...alertStyles }}>{securityMessage.text}</Alert>
                        )}

                        <Grid container spacing={3} maxWidth="sm">

                            <Grid item xs={12}>
                                <TextField
                                    label="Текущий пароль"
                                    type="password"
                                    required
                                    fullWidth
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    sx={darkInputStyles}
                                />
                            </Grid>
                        
                            <Grid item xs={12}>
                                <TextField
                                    label="Новый пароль"
                                    type="password"
                                    required
                                    fullWidth
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    sx={darkInputStyles}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Подтвердите новый пароль"
                                    type="password"
                                    required
                                    fullWidth
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    sx={darkInputStyles}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 1 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ backgroundColor: '#ff4d4d', color: '#fff', borderRadius: '12px', fontWeight: 'bold', px: 4, py: 1.2, textTransform: 'none', '&:hover': { backgroundColor: '#ff3333' } }}
                                >
                                    Обновить пароль
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};



export default Profile;
import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, TextField, Paper, Table, TableBody, Button,
    TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert,
    IconButton, Grid, Card, CardContent
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axiosConfig';

// Общие стили для темных полей ввода
const darkInputStyles = {
    '& .MuiOutlinedInput-root': {
        color: '#fff !important',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
        '&.Mui-focused fieldset': { borderColor: '#fff' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' },
    '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' },
    '& input': { color: '#fff !important' }
};

// Стили для кастомных уведомлений (Alert)
const alertStyles = {
    borderRadius: '12px',
    border: '1px solid',
    '&.MuiAlert-standardError': {
        backgroundColor: 'rgba(211, 47, 47, 0.15)',
        color: '#f44336',
        borderColor: 'rgba(211, 47, 47, 0.3)',
        '& .MuiAlert-icon': { color: '#f44336' }
    }
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState('fullName');
    const [order, setOrder] = useState('asc');

    // Состояния для модального окна Создания / Редактирования
    const [openModal, setOpenModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [error, setError] = useState('');
    
    // Поля формы
    const [fullName, setFullName] = useState('');
    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); 
    const [roleId, setRoleId] = useState('');

    // Состояние для модального окна удаления
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Состояния для модалки статистики
    const [openStatsModal, setOpenStatsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/Users');
            setUsers(response.data);
        } catch (error) {
            console.error("Ошибка при загрузке пользователей:", error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/Users/roles');
            setRoles(response.data);
        } catch (error) {
            console.error("Ошибка при загрузке ролей:", error);
        }
    };

    const handleOpenStats = async (user) => {
        setSelectedUser(user);
        setOpenStatsModal(true);
        setStats(null);
        try {
            const response = await api.get(`/Users/${user.userId}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error("Ошибка при загрузке статистики пользователя:", error);
        }
    };

    const handleCloseStatsModal = () => {
        setOpenStatsModal(false);
        setSelectedUser(null);
        setStats(null);
    };

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setOpenModal(true);
    };

    const handleOpenEditModal = (user) => {
        setIsEditMode(true);
        setEditUserId(user.userId);
        setFullName(user.fullName || '');
        setLogin(user.login || '');
        setEmail(user.email || '');
        setRoleId(user.roleId || '');
        setPassword(''); 
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setError('');
        setFullName(''); setLogin(''); setEmail(''); setPassword(''); setRoleId('');
        setEditUserId(null);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setError('');

        const userData = { 
            fullName, 
            login, 
            email, 
            roleId: parseInt(roleId) 
        };
        
        if (password) userData.password = password;

        try {
            if (isEditMode) {
                await api.put(`/Users/${editUserId}`, userData);
            } else {
                if (!password) {
                    setError("Пароль обязателен при создании пользователя");
                    return;
                }
                await api.post('/Users', userData);
            }
            handleCloseModal();
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || "Произошла ошибка при сохранении.");
        }
    };

    const handleOpenDeleteModal = (user) => {
        setUserToDelete(user);
        setOpenDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setOpenDeleteModal(false);
        setUserToDelete(null);
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const filteredUsers = users.filter((user) => {
        const searchLower = search.toLowerCase();
        return (
            user.fullName?.toLowerCase().includes(searchLower) ||
            user.login?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        );
    });

    const sortedUsers = filteredUsers.sort((a, b) => {
        let valueA = a[orderBy];
        let valueB = b[orderBy];
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    const getRoleName = (id) => {
        const role = roles.find(r => r.roleId === id);
        return role ? role.name : `Роль #${id}`;
    };

    // Функция динамического определения стилей для плашек ролей
    const getRoleBadgeStyles = (user) => {
        const roleName = getRoleName(user.roleId).toLowerCase();
        
        // Гл. Администратор (RoleId 4) -> Яркий/Глубокий красный
        if (user.roleId === 4 || roleName.includes('главн') || roleName.includes('гл.')) {
            return {
                backgroundColor: 'rgba(255, 23, 68, 0.15)',
                color: '#ff1744'
            };
        }
        // Обычный Администратор (RoleId 1) -> Светло-красный
        if (user.roleId === 1 || roleName.includes('админ')) {
            return {
                backgroundColor: 'rgba(255, 77, 77, 0.12)',
                color: '#ff4d4d'
            };
        }
        // Менеджер -> Оранжевый
        if (user.roleId === 3 || roleName.includes('менеджер') || roleName.includes('manager')) {
            return {
                backgroundColor: 'rgba(255, 145, 0, 0.15)',
                color: '#ff9100'
            };
        }
        // Все остальные (например, покупатели / пользователи) -> Зеленый
        return {
            backgroundColor: 'rgba(102, 187, 106, 0.12)',
            color: '#66bb6a'
        };
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/Users/${userToDelete.userId}`);
            handleCloseDeleteModal();
            fetchUsers(); // Обновляем список
        } catch (error) {
            console.error("Ошибка при удалении пользователя:", error);
            // Выводим ошибку из бэкенда пользователю
            const errorMessage = error.response?.data?.message || "Не удалось удалить пользователя.";
            alert(errorMessage); 
        }
    };

    return (
        <Paper sx={{ p: 4, backgroundColor: '#111111', minHeight: '85vh', borderRadius: '20px', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            
            {/* ШАПКА СТРАНИЦЫ */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Управление пользователями
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<PersonAddIcon />} 
                    onClick={handleOpenCreateModal} 
                    sx={{ backgroundColor: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', px: 3, py: 1.2, textTransform: 'none', '&:hover': { backgroundColor: '#e0e0e0' } }}
                >
                    Добавить пользователя
                </Button>
            </Box>

            {/* ПОИСК */}
            <TextField
                label="Поиск по ФИО, Логину или Email..."
                variant="outlined"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 4, ...darkInputStyles }}
            />

            {/* ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ */}
            <TableContainer sx={{ 
                backgroundColor: 'transparent',
                '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', borderBottom: 'none', fontSize: '0.9rem' }}>ID</TableCell>
                            <TableCell sx={{ borderBottom: 'none' }}>
                                <TableSortLabel 
                                    active={orderBy === 'fullName'} 
                                    direction={orderBy === 'fullName' ? order : 'asc'} 
                                    onClick={() => handleSort('fullName')}
                                    sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    ФИО
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none' }}>
                                <TableSortLabel 
                                    active={orderBy === 'login'} 
                                    direction={orderBy === 'login' ? order : 'asc'} 
                                    onClick={() => handleSort('login')}
                                    sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    Логин
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none' }}>
                                <TableSortLabel 
                                    active={orderBy === 'email'} 
                                    direction={orderBy === 'email' ? order : 'asc'} 
                                    onClick={() => handleSort('email')}
                                    sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    Email
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none' }}>
                                <TableSortLabel 
                                    active={orderBy === 'roleId'} 
                                    direction={orderBy === 'roleId' ? order : 'asc'} 
                                    onClick={() => handleSort('roleId')}
                                    sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}                                >
                                    Роль
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', borderBottom: 'none', fontSize: '0.9rem' }}>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedUsers.map((user) => (
                            <TableRow key={user.userId} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: 'none' }}>{user.userId}</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: '600', borderBottom: 'none' }}>{user.fullName}</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: 'none' }}>{user.login}</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: 'none' }}>{user.email}</TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                    <Box component="span" sx={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '6px', 
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        ...getRoleBadgeStyles(user)
                                    }}>
                                        {getRoleName(user.roleId)}
                                    </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ borderBottom: 'none' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                        <IconButton sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.05)' } }} onClick={() => handleOpenStats(user)}>
                                            <BarChartIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff4d4d', backgroundColor: 'rgba(255, 77, 77, 0.05)' } }} onClick={() => handleOpenDeleteModal(user)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* МОДАЛЬНОЕ ОКНО 1: АНАЛИТИКА И СТАТИСТИКА */}
            <Dialog 
                open={openStatsModal} 
                onClose={handleCloseStatsModal} 
                fullWidth 
                maxWidth="md"
                sx={{
                    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' },
                    '& .MuiPaper-root': { bgcolor: '#151515', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                    Статистика пользователя: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedUser?.fullName || selectedUser?.login}</span>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '24px !important' }}>
                    {stats ? (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.4)' }} variant="subtitle2" gutterBottom>Всего заказов</Typography>
                                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>{stats.totalOrders}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ backgroundColor: 'rgba(102, 187, 106, 0.05)', border: '1px solid rgba(102, 187, 106, 0.2)', borderRadius: '14px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: 'rgba(102, 187, 106, 0.6)' }} variant="subtitle2" gutterBottom>Общая выручка</Typography>
                                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#66bb6a' }}>{stats.totalRevenue} ₽</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.4)' }} variant="subtitle2" gutterBottom>Средний чек</Typography>
                                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>{stats.avgOrderAmount} ₽</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.4)' }} variant="subtitle2" gutterBottom>Оставлено отзывов</Typography>
                                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>{stats.totalReviews}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.4)' }} variant="subtitle2" gutterBottom>Статус аккаунта</Typography>
                                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#66bb6a' }}>Активен</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 3 }}>Загрузка статистики...</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button variant="outlined" onClick={handleCloseStatsModal} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        Закрыть
                    </Button>
                </DialogActions>
            </Dialog>

            {/* МОДАЛЬНОЕ ОКНО 2: СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ */}
            <Dialog 
                open={openModal} 
                onClose={handleCloseModal} 
                fullWidth 
                maxWidth="sm"
                sx={{
                    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' },
                    '& .MuiPaper-root': { bgcolor: '#151515', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                    {isEditMode ? "Редактирование пользователя" : "Добавление пользователя"}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '24px !important' }}>
                    
                    {error && <Alert severity="error" sx={alertStyles}>{error}</Alert>}

                    <TextField 
                        label="ФИО пользователя" 
                        fullWidth
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        sx={darkInputStyles}
                    />
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Логин" 
                                fullWidth
                                value={login} 
                                onChange={(e) => setLogin(e.target.value)}
                                sx={darkInputStyles}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{width: 200}}>
                            <FormControl fullWidth sx={darkInputStyles}>
                                <InputLabel>Роль</InputLabel>
                                <Select
                                    value={roleId}
                                    label="Роль"
                                    onChange={(e) => setRoleId(e.target.value)}
                                >
                                    {roles.map(r => <MenuItem key={r.roleId} value={r.roleId}>{r.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                    <TextField 
                        label="Email" 
                        type="email"
                        fullWidth
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        sx={darkInputStyles}
                    />

                    <TextField 
                        label={isEditMode ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"} 
                        type="password"
                        fullWidth
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        sx={darkInputStyles}
                    />

                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button variant="outlined" onClick={handleCloseModal} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        Отмена
                    </Button>
                    <Button variant="contained" onClick={handleSaveUser} sx={{ bgcolor: '#fff', color: '#000', fontWeight: 'bold', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#e0e0e0' } }}>
                        {isEditMode ? "Сохранить" : "Добавить"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* МОДАЛЬНОЕ ОКНО 3: ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
            <Dialog 
                open={openDeleteModal} 
                onClose={handleCloseDeleteModal} 
                fullWidth 
                maxWidth="xs"
                sx={{
                    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' },
                    '& .MuiPaper-root': { bgcolor: '#151515', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                    Удаление пользователя
                </DialogTitle>
                <DialogContent sx={{ pt: '24px !important' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Вы уверены, что хотите удалить пользователя <strong>{userToDelete?.fullName || userToDelete?.login}</strong>? Это действие необратимо.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button variant="outlined" onClick={handleCloseDeleteModal} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        Отмена
                    </Button>
                    <Button variant="contained" onClick={handleDeleteUser} sx={{ bgcolor: '#ff4d4d', color: '#fff', fontWeight: 'bold', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#ff3333' } }}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

        </Paper>
    );
};

export default Users;
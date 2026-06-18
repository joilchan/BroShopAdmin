import React, { useEffect, useState, useRef } from 'react';
import { 
    Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, TextField,
    MenuItem, Select, FormControl, InputLabel, Tabs, Tab
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api/axiosConfig';

const COLORS = ['#b39ddb', '#81d4fa', '#ffab91', '#a5d6a7', '#fff59d', '#ce93d8'];



const Dashboard = () => {
    // Режим фильтрации: 0 - по месяцам, 1 - точные даты руками
    const [filterMode, setFilterMode] = useState(0);

    // Генерируем список последних 12 месяцев для селектора
    const [availableMonths] = useState(() => {
        const months = [];
        const date = new Date(); // Июнь 2026
        for (let i = 0; i < 12; i++) {
            const m = date.getMonth();
            const y = date.getFullYear();
            const label = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
            // Сохраняем строку вида "2026-06" в качестве ключа
            const value = `${y}-${String(m + 1).padStart(2, '0')}`;
            months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
            date.setMonth(date.getMonth() - 1); // Шаг назад
        }
        return months;
    });

    // Храним выбранный месяц (по умолчанию - текущий)
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0].value);

    // Храним кастомные даты (для ручного режима)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const [stats, setStats] = useState(null);
    const [isPdfMode, setIsPdfMode] = useState(false);
    const pdfRef = useRef();

    // Загрузка данных при изменении любых фильтров
    useEffect(() => {
        fetchDetailedStats();
    }, [filterMode, selectedMonth, startDate, endDate]);
    
    const fetchDetailedStats = async () => {
        let reqStart = startDate;
        let reqEnd = endDate;

        // Если выбран режим "По месяцам", вычисляем даты программно
        if (filterMode === 0) {
            const [year, month] = selectedMonth.split('-');
            reqStart = `${year}-${month}-01`;
            // Находим последний день месяца
            const lastDay = new Date(year, month, 0).getDate();
            reqEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        }

        try {
            const response = await api.get(`/Statistics/detailed`, {
                params: { startDate: reqStart, endDate: reqEnd }
            });
            setStats(response.data);
        } catch (error) {
            console.error("Ошибка при получении аналитики:", error);
        }
    };

    const handleExportPDF = async () => {
        setIsPdfMode(true);
        setTimeout(() => {
            const input = pdfRef.current;
            const originalBg = input.style.background;
            const originalColor = input.style.color;
            const originalBorder = input.style.border;

            input.style.background = '#ffffff';
            input.style.color = '#000000';
            input.style.border = 'none';

            const textElements = input.querySelectorAll('*');
            textElements.forEach(el => {
                if(el.style) el.style.color = '#000000';
            });

            html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`BroShop_Report_${stats.period?.start}_${stats.period?.end}.pdf`);
                
                input.style.background = originalBg;
                input.style.color = originalColor;
                input.style.border = originalBorder;
                textElements.forEach(el => {
                    if(el.style) el.style.color = '';
                });
                
                setIsPdfMode(false);
            });
        }, 500);
    };

    if (!stats) return <Typography sx={{ p: 5, color: '#fff' }}>Загрузка аналитики...</Typography>;

    const textAxisColor = isPdfMode ? "#000000" : "#9e9e9e";

    return (
        <Box sx={{ color: isPdfMode ? '#000000' : 'var(--text-main, #ffffff)' }}>
            
            {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
            <Box sx={{ mb: 3, p: 3, background: 'var(--card-bg, #1a1a1a)', backdropFilter: 'var(--card-blur, none)', borderRadius: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                    <Typography variant="h5" sx={{mb: 2, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>
                        Учет и статистика
                    </Typography>

                    <Button
                        variant="contained" 
                        startIcon={<PictureAsPdfIcon />} 
                        onClick={handleExportPDF}
                        sx={{mb: 2, backgroundColor: '#ffffff', color: '#121212', borderRadius: '12px', fontWeight: 'bold', px: 3, py: 1, '&:hover': { backgroundColor: '#e5e5e5' } }}
                    >
                        Сформировать PDF
                    </Button>
                </Box>

                {/* Переключатель режимов выбора даты */}
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Tabs 
                        value={filterMode} 
                        onChange={(e, newValue) => setFilterMode(newValue)}
                        textColor="inherit"
                        TabIndicatorProps={{ style: { backgroundColor: '#b39ddb' } }}
                        sx={{ color: '#fff' }}
                    >
                        <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="По месяцам" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
                        <Tab icon={<DateRangeIcon />} iconPosition="start" label="Точный период" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
                    </Tabs>

                    {/* Поля фильтрации меняются в зависимости от выбранного режима */}
                    <Box sx={{pt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        {filterMode === 0 ? (
                            // Селектор месяцев
                            <FormControl size="small" sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'rgba(255,255,255,0.2)' } } }}>
                                <Select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    sx={{ color: '#fff', '.MuiSvgIcon-root': { color: '#fff' } }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1a1a1a', color: '#fff' } } }}
                                >
                                    {availableMonths.map((m) => (
                                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            // выбор дат вручную
                            <>
                                <TextField 
                                    label="С" type="date" size="small" value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
                                    sx={{ input: { color: '#fff' }, label: { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'rgba(255,255,255,0.2)' } } }}
                                />
                                <TextField 
                                    label="По" type="date" size="small" value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
                                    sx={{ input: { color: '#fff' }, label: { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'rgba(255,255,255,0.2)' } } }}
                                />
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ОСНОВНАЯ ОБЛАСТЬ (ЭКСПОРТИРУЕТСЯ В PDF) */}
            <Box 
                ref={pdfRef} 
                sx={{ 
                    background: isPdfMode ? '#ffffff' : 'var(--card-bg, #1a1a1a)', 
                    backdropFilter: isPdfMode ? 'none' : 'var(--card-blur, none)',
                    border: isPdfMode ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.1))', 
                    borderRadius: isPdfMode ? '0px' : '24px',
                    p: isPdfMode ? 5 : 4,
                    minHeight: '800px',
                    '& .MuiTableCell-root': {
                        color: isPdfMode ? '#000000' : 'rgba(255,255,255,0.8)',
                        borderColor: isPdfMode ? '#e0e0e0' : 'rgba(255,255,255,0.05)'
                    }
                }}
            >
                {/* ОФИЦИАЛЬНАЯ ШАПКА */}
                {isPdfMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 5 }}>
                        <Box sx={{ textAlign: 'right', fontFamily: '"Times New Roman", serif', color: '#000000' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>УТВЕРЖДАЮ</Typography>
                            <Typography variant="body1">Директор "BroShop"</Typography>
                            <Typography variant="body1">Елсуков Д. С. ___________________</Typography>
                            <Typography variant="body1">«___» ______________ 202__ г.</Typography>
                        </Box>
                    </Box>
                )}

                <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 1, color: isPdfMode ? '#000' : '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Отчет по финансовым показателям и продажам
                </Typography>
                <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: isPdfMode ? '#000' : 'var(--text-muted, #9e9e9e)' }}>
                    За период: с {stats.period?.start} по {stats.period?.end}
                </Typography>

                {/* КАРТОЧКИ СВОДКИ */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={3}>
                        <Paper elevation={0} sx={{ p: 2, textAlign: 'center', background: isPdfMode ? '#f5f5f5' : 'rgba(255,255,255,0.03)', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: isPdfMode ? '#555' : '#9e9e9e' }}>Выручка</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1, color: isPdfMode ? '#000' : '#b39ddb' }}>{(stats.totalRevenue ?? 0).toLocaleString('ru-RU')} ₽</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Paper elevation={0} sx={{ p: 2, textAlign: 'center', background: isPdfMode ? '#f5f5f5' : 'rgba(255,255,255,0.03)', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: isPdfMode ? '#555' : '#9e9e9e' }}>Всего заказов</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1, color: isPdfMode ? '#000' : '#fff' }}>{stats.totalOrders}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Paper elevation={0} sx={{ p: 2, textAlign: 'center', background: isPdfMode ? '#f5f5f5' : 'rgba(255,255,255,0.03)', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: isPdfMode ? '#555' : '#9e9e9e' }}>Средний чек</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1, color: isPdfMode ? '#000' : '#fff' }}>{Math.round(stats.averageCheck ?? 0).toLocaleString('ru-RU')} ₽</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Paper elevation={0} sx={{ p: 2, textAlign: 'center', background: isPdfMode ? '#f5f5f5' : 'rgba(255,255,255,0.03)', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: isPdfMode ? '#555' : '#9e9e9e' }}>Ожидают обработки</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1, color: isPdfMode ? '#000' : '#ffab91' }}>{stats.pendingOrders}</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* ГРАФИК ДИНАМИКИ ВЫРУЧКИ */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 4, color: isPdfMode ? '#000' : '#fff' }}>1. Динамика выручки по дням</Typography>
                <Paper elevation={0} sx={{ p: 2, mb: 4, height: 300, background: isPdfMode ? '#fff' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isPdfMode ? "#e0e0e0" : "rgba(255,255,255,0.1)"} />
                            <XAxis dataKey="date" stroke={textAxisColor} tick={{ fontSize: 12 }} />
                            <YAxis stroke={textAxisColor} tick={{ fontSize: 12 }} />
                            <RechartsTooltip contentStyle={{ backgroundColor: isPdfMode ? '#fff' : '#1a1a1a', borderRadius: '8px', color: isPdfMode ? '#000' : '#fff' }} formatter={(value) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']} />
                            <Legend wrapperStyle={{ color: textAxisColor }} />
                            <Bar dataKey="revenue" name="Выручка (₽)" fill="#b39ddb" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>

                {/* КРУГОВЫЕ ДИАГРАММЫ */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: isPdfMode ? '#000' : '#fff' }}>2. Структура продаж</Typography>
                <Grid container spacing={4} mb={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, height: 320, background: isPdfMode ? '#fff' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: isPdfMode ? '#000' : '#fff' }}>Популярные категории (шт.)</Typography>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.categoryStats} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={75} label={{ fill: textAxisColor, fontSize: 11 }}>
                                        {stats.categoryStats?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, height: 320, background: isPdfMode ? '#fff' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: isPdfMode ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: isPdfMode ? '#000' : '#fff' }}>Популярные бренды (шт.)</Typography>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.brandStats} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={75} label={{ fill: textAxisColor, fontSize: 11 }}>
                                        {stats.brandStats?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* ТАБЛИЦА ТОП-5 */}
                <Typography variant="subtitle1" sx={{pt: 3, fontWeight: 'bold', mb: 2, color: isPdfMode ? '#000' : '#fff'}}>3. Топ-5 продаваемых товаров</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', border: isPdfMode ? '1px solid #ccc' : '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '16px', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: isPdfMode ? '#f5f5f5' : 'rgba(255, 255, 255, 0.04)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Наименование товара</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Продано (шт.)</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Принесенная выручка</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.topProducts?.map((row, index) => (
                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row">{row.name}</TableCell>
                                    <TableCell align="center">{row.quantitySold}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{(row.revenue ?? 0).toLocaleString('ru-RU')} ₽</TableCell>
                                </TableRow>
                            ))}
                            {(!stats.topProducts || stats.topProducts.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>Нет данных за этот период</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </Box>
    );
};

export default Dashboard;
import React, { useEffect, useState, useRef } from 'react';
import { 
    Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api/axiosConfig';

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [groupBy, setGroupBy] = useState('day');
    const [statsData, setStatsData] = useState([]);
    
    const pdfRef = useRef();

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (orders.length > 0) {
            processStatistics(orders, groupBy);
        }
    }, [orders, groupBy]);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/Orders/all');
            const validOrders = response.data.filter(o => o.status !== 'Отменен');
            setOrders(validOrders);
        } catch (error) {
            console.error("Ошибка при получении заказов:", error);
        }
    };

    const processStatistics = (ordersData, period) => {
        const grouped = {};

        ordersData.forEach(order => {
            const date = new Date(order.orderDate);
            let key = '';

            if (period === 'day') {
                key = date.toLocaleDateString('ru-RU');
            } else if (period === 'month') {
                key = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
            }

            if (!grouped[key]) {
                grouped[key] = { name: key, revenue: 0, ordersCount: 0 };
            }

            grouped[key].revenue += (order.amount + (order.deliveryCost || 0));
            grouped[key].ordersCount += 1;
        });

        const sortedData = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
        setStatsData(sortedData);
    };

    const handleExportPDF = () => {
        const input = pdfRef.current;
        
        // Временно перекрашиваем блок в белый цвет, чтобы PDF отчет был презентабельным
        const originalBg = input.style.background;
        const originalPadding = input.style.padding;
        const originalColor = input.style.color;

        input.style.background = '#ffffff';
        input.style.color = '#121212';
        input.style.padding = '30px';
        input.style.borderRadius = '0px';

        // Форсируем перекраску текста внутри таблиц для PDF
        const textElements = input.querySelectorAll('.pdf-text, th, td, h4, h6');
        textElements.forEach(el => el.style.color = '#121212');

        html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`BroShop_Report_${new Date().toLocaleDateString('ru-RU')}.pdf`);
            
            // Возвращаем стили веб-интерфейса на место
            input.style.background = originalBg;
            input.style.padding = originalPadding;
            input.style.color = originalColor;
            input.style.borderRadius = '24px';
            textElements.forEach(el => el.style.color = '');
        });
    };

    const totalRevenue = statsData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrdersCount = statsData.reduce((sum, item) => sum + item.ordersCount, 0);

    return (
        <Box sx={{ color: 'var(--text-main)'}}>
            {/* Хедер страницы */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}
                sx={{mb: 3, p: 3, background: 'var(--card-bg)', backdropFilter: 'var(--card-blur)', borderRadius: '24px', border: '1px solid var(--border-color)'}}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', mb: 2 }}>
                    Аналитика и Отчеты
                </Typography>
                
                <Button 
                    variant="contained" 
                    startIcon={<PictureAsPdfIcon />} 
                    onClick={handleExportPDF}
                    sx={{
                        backgroundColor: '#ffffff',
                        color: '#121212',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        px: 3,
                        py: 1.2,
                        '&:hover': {
                            backgroundColor: '#e5e5e5',
                            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)'
                        }
                    }}
                >
                    Скачать PDF
                </Button>
            </Box>

            {/* Контроллеры и Карточки показателей */}
            <Grid container spacing={3} mb={4} sx={{mb: 4}}>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'var(--text-muted)', '&.Mui-focused': { color: '#b39ddb' } }}>Группировать по</InputLabel>
                        <Select
                            value={groupBy}
                            label="Группировать по"
                            onChange={(e) => setGroupBy(e.target.value)}
                            sx={{
                                color: '#ffffff',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#b39ddb' },
                                '.MuiSvgIcon-root': { color: 'var(--text-muted)' }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#1a1a1a',
                                        color: '#ffffff',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)'
                                    }
                                }
                            }}
                        >
                            <MenuItem value="day">По дням</MenuItem>
                            <MenuItem value="month">По месяцам</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ 
                        p: 2.5, textAlign: 'center', 
                        background: 'var(--card-bg)', backdropFilter: 'var(--card-blur)',
                        border: '1px solid var(--border-color)', borderRadius: '16px'
                    }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Всего заказов</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, color: '#ffffff' }}>{totalOrdersCount}</Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ 
                        p: 2.5, textAlign: 'center', 
                        background: 'var(--card-bg)', backdropFilter: 'var(--card-blur)',
                        border: '1px solid var(--border-color)', borderRadius: '16px'
                    }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Общая выручка</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5, color: '#b39ddb' }}>
                            {totalRevenue.toLocaleString('ru-RU')} ₽
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* ОБЛАСТЬ ДЛЯ ЭКСПОРТА В PDF */}
            <Box 
                ref={pdfRef} 
                sx={{ 
                    background: 'var(--card-bg)', 
                    backdropFilter: 'var(--card-blur)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '24px',
                    p: 4,
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                }}
            >
                <Typography variant="h5" className="pdf-text" sx={{ fontWeight: 'bold', mb: 4, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Отчет по продажам BroShop
                </Typography>

                <Typography variant="subtitle1" className="pdf-text" sx={{ fontWeight: 'bold', mb: 2, color: 'var(--text-muted)' }}>
                    Динамика выручки
                </Typography>
                
                {/* График выручки в неоновом стиле */}
                <Paper elevation={0} sx={{ p: 2, mb: 4, height: 350, background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                                formatter={(value) => [`${value.toLocaleString('ru-RU')} ₽`, 'Выручка']} 
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            {/* Фиолетово-неоновый бар скругленной формы */}
                            <Bar dataKey="revenue" name="Выручка (₽)" fill="#b39ddb" radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>

                <Typography variant="subtitle1" className="pdf-text" sx={{ fontWeight: 'bold', mb: 2, color: 'var(--text-muted)' }}>
                    Таблица показателей
                </Typography>

                {/* Таблица данных */}
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Период</TableCell>
                                <TableCell align="center" sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Количество заказов</TableCell>
                                <TableCell align="right" sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Выручка</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {statsData.map((row) => (
                                <TableRow key={row.name} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell component="th" scope="row" sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                                        {row.name}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)' }}>{row.ordersCount} шт.</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#b39ddb', borderBottom: '1px solid var(--border-color)' }}>
                                        {row.revenue.toLocaleString('ru-RU')} ₽
                                    </TableCell>
                                </TableRow>
                            ))}
                            {statsData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ color: 'var(--text-muted)', py: 4 }}>
                                        Нет данных для отображения
                                    </TableCell>
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
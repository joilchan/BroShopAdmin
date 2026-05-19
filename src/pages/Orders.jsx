import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, MenuItem, Select, FormControl, 
  InputLabel, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, Divider 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axiosConfig';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/Orders/all');
      setOrders(response.data);
    } catch (error) {
      console.error("Ошибка при получении всех заказов:", error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/Orders/status/${orderId}`, { status: newStatus });
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      alert("Не удалось изменить статус заказа");
    }
  };

  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setOpenDetailsModal(true);
    setOrderDetails([]); 
    try {
      const response = await api.get(`/Orders/details/${order.orderId}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке состава заказа:", error);
    }
  };

  const handleCloseDetails = () => {
    setOpenDetailsModal(false);
    setSelectedOrder(null);
    setOrderDetails([]);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'Все' || order.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      order.userName?.toLowerCase().includes(searchLower) ||
      order.address?.toLowerCase().includes(searchLower) ||
      order.orderId.toString().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // Вспомогательная функция для динамической стилизации селекторов статуса
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Доставлен':
        return { color: '#81c784', borderColor: 'rgba(129, 199, 132, 0.3)', bg: 'rgba(129, 199, 132, 0.05)' };
      case 'Отменен':
        return { color: '#e57373', borderColor: 'rgba(229, 115, 115, 0.3)', bg: 'rgba(229, 115, 115, 0.05)' };
      case 'Отправлен':
        return { color: '#64b5f6', borderColor: 'rgba(100, 181, 246, 0.3)', bg: 'rgba(100, 181, 246, 0.05)' };
      default: // В обработке
        return { color: '#ffb74d', borderColor: 'rgba(255, 183, 77, 0.3)', bg: 'rgba(255, 183, 77, 0.05)' };
    }
  };

  return (
    <Box sx={{ color: 'var(--text-main)' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', mb: 3 }}>
        Управление заказами
      </Typography>

      {/* Панель фильтров */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={8}>
            <TextField
            label="Поиск по ID, покупателю или адресу"
            variant="outlined"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputLabelProps={{ style: { color: 'var(--text-muted)' } }}
            sx={{
                '& .MuiInputLabel-root.Mui-focused': { color: '#b39ddb' },
                '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'var(--border-color)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#b39ddb' },
                },
                '& .MuiOutlinedInput-input::placeholder': {
                color: '#ffffff !important',
                opacity: '1 !important', // Обязательно, иначе MUI сделает его полупрозрачным
                },
                '& input': { color: '#fff !important' } // Делает вводимый текст белым
            }}
            />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'var(--text-muted)', '&.Mui-focused': { color: '#b39ddb' } }}>Фильтр по статусу</InputLabel>
            <Select
              value={statusFilter}
              label="Фильтр по статусу"
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <MenuItem value="Все">📋 Все заказы</MenuItem>
              <MenuItem value="В обработке">⏳ В обработке</MenuItem>
              <MenuItem value="Отправлен">🚚 Отправлен</MenuItem>
              <MenuItem value="Доставлен">✅ Доставлен</MenuItem>
              <MenuItem value="Отменен">❌ Отменен</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Таблица заказов */}
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          background: 'var(--card-bg)', 
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)', 
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
            <TableRow>
              <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>ID Заказа</TableCell>
              <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Покупатель</TableCell>
              <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Дата и время</TableCell>
              <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Адрес доставки</TableCell>
              <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Итоговая сумма</TableCell>
              <TableCell sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }} width="180px">Статус</TableCell>
              <TableCell align="center" sx={{ color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }} width="90px">Детали</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const statusStyle = getStatusStyles(order.status);
                return (
                  <TableRow key={order.orderId} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b39ddb', borderBottom: '1px solid var(--border-color)' }}>
                      #{order.orderId}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)' }}>{order.userName}</TableCell>
                    <TableCell sx={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)' }}>
                      {new Date(order.orderDate).toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)' }}>{order.address}</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                      {order.amount + (order.deliveryCost || 0)} ₽
                      <Typography variant="caption" display="block" sx={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        (Доставка: {order.deliveryCost} ₽)
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                      {/* Кастомный выпадающий список изменения статуса */}
                      <Select
                        value={order.status || ''}
                        size="small"
                        fullWidth
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '8px',
                          '.MuiOutlinedInput-notchedOutline': { borderColor: statusStyle.borderColor },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: statusStyle.color },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: statusStyle.color },
                          '.MuiSvgIcon-root': { color: statusStyle.color }
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
                        <MenuItem value="В обработке">⏳ В обработке</MenuItem>
                        <MenuItem value="Отправлен">🚚 Отправлен</MenuItem>
                        <MenuItem value="Доставлен">✅ Доставлен</MenuItem>
                        <MenuItem value="Отменен">❌ Отменен</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid var(--border-color)' }}>
                      <IconButton sx={{ color: '#ffffff', '&:hover': { color: '#b39ddb' } }} onClick={() => handleOpenDetails(order)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'var(--text-muted)' }}>
                  Ни одного заказа не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* МОДАЛЬНОЕ ОКНО: ДЕТАЛИ ЗАКАЗА (С ОБНОВЛЕННЫМ СТИЛЕМ ВЫПЛЫВАНИЯ) */}
      <Dialog 
        open={openDetailsModal} 
        onClose={handleCloseDetails} 
        fullWidth 
        maxWidth="sm"
        sx={{
          '& .MuiBackdrop-root': { 
            backgroundColor: 'rgba(0, 0, 0, 0.85)', 
            backdropFilter: 'blur(10px)' 
          },
          '& .MuiPaper-root': { 
            backgroundColor: '#151515', 
            color: '#ffffff', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.15)', 
            boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', 
            p: 1 
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
          Состав заказа #{selectedOrder?.orderId}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedOrder && (
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}><strong>Покупатель:</strong> <span style={{ color: '#fff' }}>{selectedOrder.userName}</span></Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}><strong>Адрес:</strong> <span style={{ color: '#fff' }}>{selectedOrder.address}</span></Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}><strong>Дата создания:</strong> <span style={{ color: '#fff' }}>{new Date(selectedOrder.orderDate).toLocaleString('ru-RU')}</span></Typography>
            </Box>
          )}
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

          {orderDetails.length > 0 ? (
            orderDetails.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 2 }}>
                <img 
                  src={item.imageUrl || 'https://via.placeholder.com/60'} 
                  alt={item.productName} 
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#fff' }}>{item.productName}</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>Размер: <strong style={{ color: '#b39ddb' }}>{item.size}</strong></Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>Количество: {item.quantity} шт.</Typography>
                </Box>
                <Box align="right">
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ffffff' }}>{item.price} ₽</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>за шт.</Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Typography align="center" sx={{ py: 3, color: 'var(--text-muted)' }}>Загрузка товаров...</Typography>
          )}

          <Divider sx={{ mt: 3, mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
          {selectedOrder && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography sx={{ color: 'var(--text-muted)' }}>Стоимость товаров + Доставка:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#b39ddb' }}>
                {selectedOrder.amount + (selectedOrder.deliveryCost || 0)} ₽
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button 
            onClick={handleCloseDetails} 
            variant="contained" 
            sx={{
              backgroundColor: '#ffffff',
              color: '#121212',
              borderRadius: '10px',
              fontWeight: 'bold',
              px: 3,
              '&:hover': { backgroundColor: '#e5e5e5' }
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
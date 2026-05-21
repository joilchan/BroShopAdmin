import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TableSortLabel, TextField, MenuItem, Select, 
  FormControl, InputLabel, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, Divider 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api/axiosConfig';

// Общие стили для темных полей ввода (синхронизировано с Users)
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все');
  
  // Состояния для сортировки
  const [orderBy, setOrderBy] = useState('orderId');
  const [orderDirection, setOrderDirection] = useState('desc');

  // Состояния для деталей заказа
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

  const handleSort = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Фильтрация
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'Все' || order.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      order.userName?.toLowerCase().includes(searchLower) ||
      order.address?.toLowerCase().includes(searchLower) ||
      order.orderId.toString().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // Сортировка данных
  const sortedOrders = filteredOrders.sort((a, b) => {
    let valueA = a[orderBy];
    let valueB = b[orderBy];

    if (orderBy === 'orderDate') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    } else if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) return orderDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return orderDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Функция динамического определения стилей для статусов в выпадающих списках
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Доставлен':
        return { color: '#66bb6a', bg: 'rgba(102, 187, 106, 0.12)', borderColor: 'rgba(102, 187, 106, 0.25)' };
      case 'Отменен':
        return { color: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.12)', borderColor: 'rgba(255, 77, 77, 0.25)' };
      case 'Отправлен':
        return { color: '#42a5f5', bg: 'rgba(66, 165, 245, 0.12)', borderColor: 'rgba(66, 165, 245, 0.25)' };
      default: // В обработке
        return { color: '#ff9100', bg: 'rgba(255, 145, 0, 0.15)', borderColor: 'rgba(255, 145, 0, 0.25)' };
    }
  };

  return (
    <Paper sx={{ p: 4, backgroundColor: '#111111', minHeight: '85vh', borderRadius: '20px', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      
      {/* ШАПКА СТРАНИЦЫ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Управление заказами
        </Typography>
      </Box>

      {/* ПАНЕЛЬ ФИЛЬТРОВ И ПОИСКА */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Поиск по ID, покупателю или адресу..."
            variant="outlined"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ ...darkInputStyles }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth sx={{ ...darkInputStyles }}>
            <InputLabel>Фильтр по статусу</InputLabel>
            <Select
              value={statusFilter}
              label="Фильтр по статусу"
              onChange={(e) => setStatusFilter(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiMenuItem-root:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
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

      {/* ТАБЛИЦА ЗАКАЗОВ */}
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
              
              <TableCell sx={{ borderBottom: 'none' }}>
                <TableSortLabel 
                  active={orderBy === 'orderId'} 
                  direction={orderBy === 'orderId' ? orderDirection : 'asc'} 
                  onClick={() => handleSort('orderId')}
                  sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                >
                  ID Заказа
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ borderBottom: 'none' }}>
                <TableSortLabel 
                  active={orderBy === 'userName'} 
                  direction={orderBy === 'userName' ? orderDirection : 'asc'} 
                  onClick={() => handleSort('userName')}
                  sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                >
                  Покупатель
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ borderBottom: 'none' }}>
                <TableSortLabel 
                  active={orderBy === 'orderDate'} 
                  direction={orderBy === 'orderDate' ? orderDirection : 'asc'} 
                  onClick={() => handleSort('orderDate')}
                  sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                >
                  Дата и время
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', borderBottom: 'none', fontSize: '0.9rem' }}>
                Адрес доставки
              </TableCell>

              <TableCell sx={{ borderBottom: 'none' }}>
                <TableSortLabel 
                  active={orderBy === 'amount'} 
                  direction={orderBy === 'amount' ? orderDirection : 'asc'} 
                  onClick={() => handleSort('amount')}
                  sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.4) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                >
                  Итоговая сумма
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', borderBottom: 'none', fontSize: '0.9rem' }} width="190px">
                Статус
              </TableCell>

              <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', borderBottom: 'none', fontSize: '0.9rem' }} width="90px">
                Детали
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => {
                const statusStyle = getStatusStyles(order.status);
                return (
                  <TableRow key={order.orderId} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', borderBottom: 'none' }}>
                      #{order.orderId}
                    </TableCell>
                    
                    <TableCell sx={{ color: '#fff', fontWeight: '600', borderBottom: 'none' }}>
                      {order.userName}
                    </TableCell>
                    
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: 'none' }}>
                      {new Date(order.orderDate).toLocaleString('ru-RU')}
                    </TableCell>
                    
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: 'none' }}>
                      {order.address}
                    </TableCell>
                    
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: 'none' }}>
                      {order.amount + (order.deliveryCost || 0)} ₽
                      <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 'normal' }}>
                        (Доставка: {order.deliveryCost} ₽)
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ borderBottom: 'none' }}>
                      <Select
                        value={order.status || ''}
                        size="small"
                        fullWidth
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: '600',
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
                              border: '1px solid rgba(255,255,255,0.1)',
                              '& .MuiMenuItem-root:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
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
                    
                    <TableCell align="center" sx={{ borderBottom: 'none' }}>
                      <IconButton sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }} onClick={() => handleOpenDetails(order)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>

                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'rgba(255,255,255,0.4)', borderBottom: 'none' }}>
                  Ни одного заказа не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* МОДАЛЬНОЕ ОКНО: ДЕТАЛИ ЗАКАЗА */}
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
            backgroundColor: '#111111', 
            color: '#ffffff', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', 
            p: 1 
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2 }}>
          Состав заказа #{selectedOrder?.orderId}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedOrder && (
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}><strong>Покупатель:</strong> <span style={{ color: '#fff' }}>{selectedOrder.userName}</span></Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}><strong>Адрес:</strong> <span style={{ color: '#fff' }}>{selectedOrder.address}</span></Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}><strong>Дата создания:</strong> <span style={{ color: '#fff' }}>{new Date(selectedOrder.orderDate).toLocaleString('ru-RU')}</span></Typography>
            </Box>
          )}
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

          {orderDetails.length > 0 ? (
            orderDetails.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 2 }}>
                <img 
                  src={item.imageUrl || 'https://via.placeholder.com/60'} 
                  alt={item.productName} 
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: '600', color: '#fff' }}>{item.productName}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Размер: <strong style={{ color: '#fff' }}>{item.size}</strong></Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Количество: {item.quantity} шт.</Typography>
                </Box>
                <Box align="right">
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ffffff' }}>{item.price} ₽</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>за шт.</Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Typography align="center" sx={{ py: 3, color: 'rgba(255,255,255,0.4)' }}>Загрузка товаров...</Typography>
          )}

          <Divider sx={{ mt: 3, mb: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
          {selectedOrder && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Стоимость товаров + Доставка:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
                {selectedOrder.amount + (selectedOrder.deliveryCost || 0)} ₽
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button 
            onClick={handleCloseDetails} 
            variant="contained" 
            sx={{
              backgroundColor: '#ffffff',
              color: '#111111',
              borderRadius: '10px',
              fontWeight: 'bold',
              px: 3,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#e0e0e0' }
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Orders;
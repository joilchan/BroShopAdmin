import React, { useEffect, useState, useMemo } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, IconButton, Typography, Box, Dialog, DialogTitle, 
    DialogContent, TextField, DialogActions, MenuItem, Avatar, TableSortLabel, Grid, FormControl, InputLabel, Select
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/axiosConfig';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [types, setTypes] = useState([]);
    
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('Все'); 
    const [selectedType, setSelectedType] = useState('Все');   

    const [orderBy, setOrderBy] = useState('name'); 
    const [order, setOrder] = useState('asc');      

    const [open, setOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: 0,
        description: '',
        imageUrl: '',
        brandId: '',
        productTypeId: '',
        productVariants: []
    });

    const [isEdit, setIsEdit] = useState(false); 
    const [editId, setEditId] = useState(null);   

    const [openDictionary, setOpenDictionary] = useState(false);
    const [dictionaryType, setDictionaryType] = useState('brand'); 
    const [dictionaryValue, setDictionaryValue] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, brandRes, typeRes] = await Promise.all([
                api.get('/Products'),
                api.get('/Brands'),
                api.get('/ProductTypes')
            ]);
            setProducts(prodRes.data);
            setBrands(brandRes.data);
            setTypes(typeRes.data);
        } catch (err) {
            console.error("Ошибка при загрузке данных", err);
        }
    };

    const handleSortRequest = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const processedProducts = useMemo(() => {
        const filtered = products.filter((product) => {
            const searchLower = search.toLowerCase();
            const matchesSearch = 
                product.name?.toLowerCase().includes(searchLower) ||
                product.brand?.name?.toLowerCase().includes(searchLower) ||
                product.productType?.name?.toLowerCase().includes(searchLower);

            const matchesBrand = selectedBrand === 'Все' || product.brandId === parseInt(selectedBrand);
            const matchesType = selectedType === 'Все' || product.productTypeId === parseInt(selectedType);

            return matchesSearch && matchesBrand && matchesType;
        });

        return [...filtered].sort((a, b) => {
            let valueA = a[orderBy];
            let valueB = b[orderBy];

            if (orderBy === 'brand') {
                valueA = a.brand?.name || '';
                valueB = b.brand?.name || '';
            }
            if (orderBy === 'productType') {
                valueA = a.productType?.name || '';
                valueB = b.productType?.name || '';
            }

            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();

            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [products, search, selectedBrand, selectedType, orderBy, order]);

    const addVariantField = () => {
        setNewProduct({
            ...newProduct,
            productVariants: [...newProduct.productVariants, { size: '', stockQuantity: 0 }]
        });
    };

    const handleEditOpen = (product) => {
        setIsEdit(true);
        setEditId(product.productId);
        setNewProduct({
            name: product.name || '',
            price: product.price || 0,
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            brandId: product.brandId || '',
            productTypeId: product.productTypeId || '',
            productVariants: product.productVariants ? [...product.productVariants] : []
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...newProduct,
                brandId: parseInt(newProduct.brandId),
                productTypeId: parseInt(newProduct.productTypeId),
                price: parseFloat(newProduct.price),
                productVariants: newProduct.productVariants.map(v => ({
                    ...v,
                    stockQuantity: parseInt(v.stockQuantity) || 0
                }))
            };

            if (isEdit) {
                await api.put(`/Products/${editId}`, { ...payload, productId: editId });
            } else {
                await api.post('/Products', payload);
            }

            handleClose();
            loadData();
        } catch (err) {
            alert("Ошибка при сохранении: " + err.message);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        setNewProduct({ name: '', price: 0, description: '', imageUrl: '', brandId: '', productTypeId: '', productVariants: [] });
    };

    const handleVariantChange = (index, field, value) => {
        // Если меняем количество, проверяем, чтобы число не было отрицательным
        if (field === 'stockQuantity') {
            if (value !== "" && Number(value) < 0) {
                return; // Игнорируем изменения, если число меньше нуля
            }
        }

        const updatedVariants = newProduct.productVariants.map((variant, i) => {
            if (i === index) {
                return { ...variant, [field]: value };
            }
            return variant;
        });

        setNewProduct({ ...newProduct, productVariants: updatedVariants });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Удалить этот товар?")) {
            try {
                await api.delete(`/Products/${id}`);
                loadData();
            } catch (err) {
                console.error("Ошибка при удалении:", err);
                alert("Не удалось удалить товар.");
            }
        }
    };

    const handleAddDictionaryItem = async () => {
        if (!dictionaryValue.trim()) return;
        try {
            if (dictionaryType === 'brand') {
                await api.post('/Brands', { name: dictionaryValue });
            } else {
                await api.post('/ProductTypes', { name: dictionaryValue });
            }
            setDictionaryValue('');
            loadData();
        } catch (err) {
            alert("Ошибка при добавлении: " + err.message);
        }
    };

    const handleDeleteDictionaryItem = async (id, name) => {
        if (dictionaryType === 'brand') {
            const hasProducts = products.some(p => p.brandId === id);
            if (hasProducts) {
                alert(`Нельзя удалить бренд "${name}", так как к нему привязаны товары!`);
                return;
            }
            if (window.confirm(`Удалить бренд "${name}"?`)) {
                try {
                    await api.delete(`/Brands/${id}`);
                    if (selectedBrand === String(id)) setSelectedBrand('Все');
                    loadData();
                } catch (err) { alert("Ошибка удаления: " + err.message); }
            }
        } else {
            const hasProducts = products.some(p => p.productTypeId === id);
            if (hasProducts) {
                alert(`Нельзя удалить категорию "${name}", так как к ней привязаны товары!`);
                return;
            }
            if (window.confirm(`Удалить категорию "${name}"?`)) {
                try {
                    await api.delete(`/ProductTypes/${id}`);
                    if (selectedType === String(id)) setSelectedType('Все');
                    loadData();
                } catch (err) { alert("Ошибка удаления: " + err.message); }
            }
        }
    };

    const handlePriceChange = (e) => {
        const value = e.target.value;
        
        // Если строка пустая, позволяем стереть всё. 
        // Иначе проверяем, что число больше или равно 0.
        if (value === "" || Number(value) >= 0) {
            setPrice(value); // Или ваша функция обновления состояния (например, в handleChange для формы)
        }
    };

    return (
        <Paper sx={{ p: 4, backgroundColor: '#111111', minHeight: '85vh', borderRadius: '20px', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            
            {/* ЗАГОЛОВОК И КНОПКИ УПРАВЛЕНИЯ */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Управление складом
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        onClick={() => { setDictionaryType('brand'); setOpenDictionary(true); }}
                        sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', textTransform: 'none', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.05)' } }}
                    >
                        Справочники
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => { handleClose(); setOpen(true); }}
                        sx={{ backgroundColor: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', textTransform: 'none', '&:hover': { backgroundColor: '#e0e0e0' } }}
                    >
                        Добавить товар
                    </Button>
                </Box>
            </Box>

            {/* ПАНЕЛЬ ФИЛЬТРОВ И ПОИСКА */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <TextField
                        label="Поиск по названию, бренду или типу..."
                        variant="outlined"
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                        }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth sx={{
                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}>
                        <InputLabel>Категория</InputLabel>
                        <Select
                            value={selectedType}
                            label="Категория"
                            onChange={(e) => setSelectedType(e.target.value)}
                            sx={{ color: '#fff' }}
                        >
                            <MenuItem value="Все">Все категории</MenuItem>
                            {types.map(t => <MenuItem key={t.productTypeId} value={t.productTypeId}>{t.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth sx={{
                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}>
                        <InputLabel>Бренд</InputLabel>
                        <Select
                            value={selectedBrand}
                            label="Бренд"
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            sx={{ color: '#fff' }}
                        >
                            <MenuItem value="Все">Все бренды</MenuItem>
                            {brands.map(b => <MenuItem key={b.brandId} value={b.brandId}>{b.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* ТАБЛИЦА ТОВАРОВ */}
            <TableContainer sx={{ backgroundColor: 'transparent', '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>Фото</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleSortRequest('name')}
                                    sx={{ color: 'rgba(255,255,255,0.5) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    Название
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'productType'}
                                    direction={orderBy === 'productType' ? order : 'asc'}
                                    onClick={() => handleSortRequest('productType')}
                                    sx={{ color: 'rgba(255,255,255,0.5) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    Категория
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'brand'}
                                    direction={orderBy === 'brand' ? order : 'asc'}
                                    onClick={() => handleSortRequest('brand')}
                                    sx={{ color: 'rgba(255,255,255,0.5) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    Бренд
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>Размеры на складе</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'price'}
                                    direction={orderBy === 'price' ? order : 'asc'}
                                    onClick={() => handleSortRequest('price')}
                                    sx={{ color: 'rgba(255,255,255,0.5) !important', '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5) !important' }, '&.Mui-active': { color: '#fff !important' } }}
                                >
                                    Цена
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {processedProducts.length > 0 ? (
                            processedProducts.map((row) => (
                                <TableRow key={row.productId} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' }, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <TableCell>
                                        <Avatar 
                                            src={row.imageUrl} 
                                            variant="rounded" 
                                            sx={{ width: 50, height: 50, border: '1px solid rgba(255, 255, 255, 0.1)', bgcolor: '#222' }}
                                        >
                                            {row.name ? row.name[0] : '?'}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: '600' }}>{row.name}</TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{row.productType?.name}</TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{row.brand?.name}</TableCell>
                                    <TableCell>
                                        {row.productVariants && row.productVariants.length > 0 ? (
                                            row.productVariants.map((v, i) => (
                                                <Box key={i} sx={{ fontSize: '0.75rem', color: '#fff', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', mb: 0.5, p: '4px 8px', borderRadius: '6px', display: 'inline-block', mr: 0.5 }}>
                                                    <strong>{v.size}</strong>: {v.stockQuantity} шт.
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography variant="caption" sx={{ color: '#ff4d4d', fontWeight: '600' }}>Нет на складе</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: '600' }}>{row.price} ₽</TableCell>
                                   <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton 
                                                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }} 
                                                onClick={() => handleEditOpen(row)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton 
                                                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff4d4d' } }} 
                                                onClick={() => handleDelete(row.productId)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'rgba(255,255,255,0.4)', borderBottom: 'none' }}>
                                    Towары не найдены
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* МЕНЕДЖЕР БРЕНДОВ И КАТЕГОРИЙ (СЛОВАРЬ) */}
            <Dialog 
                open={openDictionary} 
                onClose={() => setOpenDictionary(false)} 
                fullWidth 
                maxWidth="xs"
                sx={{
                    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' },
                    '& .MuiPaper-root': { bgcolor: '#151515', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', p: 1 }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography 
                            variant="h6" 
                            onClick={() => setDictionaryType('brand')}
                            sx={{ cursor: 'pointer', fontWeight: 'bold', color: dictionaryType === 'brand' ? '#fff' : 'rgba(255,255,255,0.4)', borderBottom: dictionaryType === 'brand' ? '2px solid #fff' : 'none', pb: 0.5 }}
                        >
                            Бренды
                        </Typography>
                        <Typography 
                            variant="h6" 
                            onClick={() => setDictionaryType('type')}
                            sx={{ cursor: 'pointer', fontWeight: 'bold', color: dictionaryType === 'type' ? '#fff' : 'rgba(255,255,255,0.4)', borderBottom: dictionaryType === 'type' ? '2px solid #fff' : 'none', pb: 0.5 }}
                        >
                            Категории
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 1, mt: 3, mb: 3 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label={dictionaryType === 'brand' ? "Новый бренд" : "Новая категория"}
                            value={dictionaryValue}
                            onChange={(e) => setDictionaryValue(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                            }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleAddDictionaryItem}
                            sx={{ bgcolor: '#fff', color: '#000', borderRadius: '10px', minWidth: '50px', '&:hover': { bgcolor: '#e0e0e0' } }}
                        >
                            <AddIcon />
                        </Button>
                    </Box>
                    <Box sx={{ maxHeight: '250px', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
                        {(dictionaryType === 'brand' ? brands : types).map(item => {
                            const id = dictionaryType === 'brand' ? item.brandId : item.productTypeId;
                            return (
                                <Box key={id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: "10px 0", borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography sx={{ color: '#fff', fontSize: '0.95rem' }}>{item.name}</Typography>
                                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff4d4d' } }} onClick={() => handleDeleteDictionaryItem(id, item.name)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            );
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button variant="outlined" onClick={() => setOpenDictionary(false)} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            {/* ОКНО ТОВАРА (ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ) */}
            <Dialog 
                open={open} 
                onClose={handleClose} 
                fullWidth 
                maxWidth="sm"
                sx={{
                    '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' },
                    '& .MuiPaper-root': { bgcolor: '#151515', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0px 10px 40px rgba(0,0,0,0.8)', p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                    {isEdit ? "Редактирование товара" : "Добавление товара"}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '24px !important' }}>
                    
                    <TextField 
                        label="Название товара" 
                        fullWidth
                        value={newProduct.name} 
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        sx={{
                            '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                        }}
                    />
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} sx={{width:150}}>
                            <TextField 
                                label="Цена (₽)" 
                                type="number" 
                                fullWidth
                                inputProps={{ min: 0 }}
                                value={newProduct.price} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || Number(val) >= 0) {
                                        setNewProduct({ ...newProduct, price: val });
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { 
                                        color: '#fff !important', 
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                                        borderRadius: '10px', 
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, 
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, 
                                        '&.Mui-focused fieldset': { borderColor: '#fff' } 
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, 
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, 
                                    '& input': { color: '#fff !important' },
                                    
                                    // ВОТ ЗДЕСЬ ИСПРАВЛЕНО (добавлены кавычки вокруг 'none'):
                                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                        '-webkit-appearance': 'none',
                                        margin: 0,
                                    },
                                    '& input[type=number]': {
                                        '-moz-appearance': 'textfield',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{width: 200}}>
                            <FormControl fullWidth sx={ 
                                {
                                
                                '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                            }}>
                                <InputLabel>Категория</InputLabel>
                                <Select
                                    value={newProduct.productTypeId}
                                    label="Категория"
                                    onChange={(e) => setNewProduct({...newProduct, productTypeId: e.target.value})}
                                >
                                    {types.map(t => <MenuItem key={t.productTypeId} value={t.productTypeId}>{t.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    
                        <Grid item xs={12} sm={6} sx={{width: 170}}>
                            <FormControl fullWidth sx={{
                                '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                            }}>
                                <InputLabel>Бренд</InputLabel>
                                <Select
                                    value={newProduct.brandId}
                                    label="Бренд"
                                    onChange={(e) => setNewProduct({...newProduct, brandId: e.target.value})}
                                >
                                    {brands.map(b => <MenuItem key={b.brandId} value={b.brandId}>{b.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                    <Grid container spacing={2}>
                        
                        <Grid item xs={12} sm={6} sx={{width: 2500}}>
                            <TextField 
                                label="Ссылка на изображение" 
                                fullWidth
                                value={newProduct.imageUrl} 
                                onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                                sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                                }}
                            />
                        </Grid>
                    </Grid>

                    <TextField 
                        label="Описание товара" 
                        fullWidth
                        multiline
                        rows={2}
                        value={newProduct.description} 
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        sx={{
                            '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& textarea': { color: '#fff !important' }
                        }}
                    />

                    {/* БЛОК РАЗМЕРОВ */}
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="600" sx={{ color: 'rgba(255,255,255,0.7)' }}>Размеры и количество</Typography>
                            <Button size="small" variant="outlined" onClick={addVariantField} startIcon={<AddIcon />} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', textTransform: 'none', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                Добавить размер
                            </Button>
                        </Box>

                        {newProduct.productVariants.map((v, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
                                <TextField 
                                    label="Размер" 
                                    placeholder="XL, 42, и т.д."
                                    size="small"
                                    fullWidth
                                    value={v.size}
                                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                                    }}
                                />
                                <TextField 
                                    label="Кол-во" 
                                    type="number" 
                                    size="small"
                                    // Передаем min нативному инпуту количества
                                    inputProps={{ min: 0 }}
                                    value={v.stockQuantity}
                                    onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                                    sx={{
                                        width: '140px',
                                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' },
                                        // СКРЫВАЕМ СТРЕЛОЧКИ ТУТ:
                                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                            '-webkit-appearance': 'none',
                                            margin: 0,
                                        },
                                        '& input[type=number]': {
                                            '-moz-appearance': 'textfield',
                                        },
                                    }}
                                />
                                <IconButton 
                                    sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff4d4d' } }} 
                                    onClick={() => {
                                        const filtered = newProduct.productVariants.filter((_, i) => i !== index);
                                        setNewProduct({ ...newProduct, productVariants: filtered });
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button variant="outlined" onClick={handleClose} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>Отмена</Button>
                    <Button variant="contained" onClick={handleSubmit} sx={{ bgcolor: '#fff', color: '#000', fontWeight: 'bold', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#e0e0e0' } }}>
                        {isEdit ? "Сохранить" : "Добавить"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default Products;
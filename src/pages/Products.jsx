import React, { useEffect, useState, useMemo } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, IconButton, Typography, Box, Dialog, DialogTitle, 
    DialogContent, TextField, DialogActions, MenuItem, Avatar, TableSortLabel, Grid, FormControl, InputLabel, Select
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
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
        if (field === 'stockQuantity') {
            if (value !== "" && Number(value) < 0) {
                return;
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

                if (editId === id) {
                    handleClose();
                }
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
                alert(`Нельзя удалить категорию "${name}", так как к ней привязана товары!`);
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

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', color: '#fff' }}>
            
            {/* ВЕРХНЯЯ ПАНЕЛЬ С КНОПКАМИ И ЗАГОЛОВКОМ */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                        onClick={() => {
                            setIsEdit(false);
                            setEditId(null);
                            setNewProduct({ name: '', price: 0, description: '', imageUrl: '', brandId: '', productTypeId: '', productVariants: [] });
                            setOpen(true);
                        }}
                        sx={{ backgroundColor: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', textTransform: 'none', '&:hover': { backgroundColor: '#e0e0e0' } }}
                    >
                        Добавить товар
                    </Button>
                </Box>
            </Box>

            {/* ГЛАВНЫЙ КОНТЕЙНЕР ДЛЯ РАЗДЕЛЕНИЯ ПРОСТРАНСТВА */}
            <Box sx={{ 
                display: 'flex', 
                width: '100%', 
                gap: open ? 2 : 0,
                alignItems: 'flex-start',
                transition: 'all 0.35s ease'
            }}>
                
                {/* ЛЕВАЯ СТОРОНА: ТАБЛИЦА И ФИЛЬТРЫ */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        overflowX: 'auto',
                        pr: 1,
                        width: '100%', 
                        mb: 3
                    }}>
                    <Paper sx={{ 
                        p: 4, 
                        backgroundColor: 'rgba(17, 17, 17, 0.75)', 
                        backdropFilter: 'blur(12px)', 
                        minHeight: '85vh', 
                        borderRadius: '24px', 
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        width: '100%'
                    }}>
                        {/* ПАНЕЛЬ ФИЛЬТРОВ И ПОИСКА */}
                        <Grid container spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                            <Grid item xs={12} md={open ? 12 : 5} lg={open ? 4 : 4}>
                                <TextField
                                    label="Поиск по названию, бренду..."
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5) !important', fontSize: '0.9rem' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                                    }}
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={open ? 6 : 3} lg={open ? 4 : 2.5}>
                                <FormControl fullWidth size="small" sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5) !important', fontSize: '0.9rem' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.5)' }
                                }}>
                                    <InputLabel>Категория</InputLabel>
                                    <Select value={selectedType} label="Категория" onChange={(e) => setSelectedType(e.target.value)} sx={{ color: '#fff' }}>
                                        <MenuItem value="Все">Все категории</MenuItem>
                                        {types.map(t => <MenuItem key={t.productTypeId} value={t.productTypeId}>{t.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={open ? 6 : 3} lg={open ? 4 : 2.5}>
                                <FormControl fullWidth size="small" sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5) !important', fontSize: '0.9rem' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.5)' }
                                }}>
                                    <InputLabel>Бренд</InputLabel>
                                    <Select value={selectedBrand} label="Бренд" onChange={(e) => setSelectedBrand(e.target.value)} sx={{ color: '#fff' }}>
                                        <MenuItem value="Все">Все бренды</MenuItem>
                                        {brands.map(b => <MenuItem key={b.brandId} value={b.brandId}>{b.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* ТАБЛИЦА ТОВАРОВ */}
                        <TableContainer
                            component={Paper} 
                            sx={{ 
                                //width: '100%', // Занимает 100% ширины родителя
                                bgcolor: '#1e1e1e', 
                                borderRadius: '15px', 
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                overflow: 'hidden',

                                flexDirection: 'column', 
                                p: 1,
                                gap: 2, 
                                pr: 1,
                                '&::-webkit-scrollbar': { width: '10px' }, 
                                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' } 
                            }}>
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
                                        {/* Прячем колонку размеров на узких экранах при открытой панели для экономии места */}
                                        {!open && <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>Размеры на складе</TableCell>}
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
                                            <TableRow 
                                                key={row.productId} 
                                                onClick={() => handleEditOpen(row)}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, 
                                                    backgroundColor: editId === row.productId ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <TableCell>
                                                    <Avatar src={row.imageUrl} variant="rounded" sx={{ width: 50, height: 50, border: '1px solid rgba(255, 255, 255, 0.1)', bgcolor: '#222' }}>
                                                        {row.name ? row.name[0] : '?'}
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell sx={{ color: '#fff', fontWeight: '600' }}>{row.name}</TableCell>
                                                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{row.productType?.name}</TableCell>
                                                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{row.brand?.name}</TableCell>
                                                
                                                {!open && (
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
                                                )}

                                                <TableCell sx={{ color: '#fff', fontWeight: '600' }}>{row.price} ₽</TableCell>
                                                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <IconButton sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }} onClick={() => handleEditOpen(row)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff4d4d' } }} onClick={() => handleDelete(row.productId)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={open ? 6 : 7} align="center" sx={{ py: 5, color: 'rgba(255,255,255,0.4)', borderBottom: 'none' }}>
                                                Товары не найдены
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>

                {/* ПРАВАЯ СТОРОНА: КАРТОЧКА ТОВАРА (ВЫЕЗЖАЕТ ПЛАВНО) */}
                <Box sx={{ 
                    flex: open ? '0 0 calc(36% - 24px)' : '0 0 0%', 
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(40px)', 
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    visibility: open ? 'visible' : 'hidden',
                    position: 'sticky',
                    top: '24px'
                }}>
                    <Paper sx={{ 
                        p: 3, 
                        backgroundColor: '#151515', 
                        color: '#fff',
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.12)', 
                        boxShadow: '0px 10px 40px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '80vh' // Оставляем лимит, чтобы карточка не улетала ниже экрана при куче размеров
                    }}>
                        {/* БЛОК ПРЕВЬЮ КАРТИНКИ */}
                        {newProduct.imageUrl && (
                            <Box sx={{ 
                                width: '100%', 
                                height: '850px', 
                                mb: 2, 
                                borderRadius: '8px', 
                                overflow: 'hidden', 
                                border: '1px solid rgba(255,255,255,0.1)' 
                            }}>
                                <img 
                                    src={newProduct.imageUrl} 
                                    alt="Превью" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/150'} // Заглушка, если ссылка битая
                                />
                            </Box>
                        )} 

                        {/* ХЕДЕР КАРТОЧКИ */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                {isEdit ? "Редактирование товара" : "Добавление товара"}
                            </Typography>
                            <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {/* СКРОЛЛИРУЕМЫЙ КОНТЕНТ ФОРМЫ */}
                        <Box sx={{ 
                            overflowY: 'auto', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            p: 1,
                            gap: 2, 
                            pr: 1,
                            '&::-webkit-scrollbar': { width: '10px' }, 
                            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' } 
                        }}>
                            
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
                                <Grid item xs={12}>
                                    <TextField 
                                        label="Цена (₽)" 
                                        type="number" 
                                        width="150"
                                        inputProps={{ min: 0 }}
                                        value={newProduct.price} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || Number(val) >= 0) {
                                                setNewProduct({ ...newProduct, price: val });
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' },
                                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                                            '& input[type=number]': { '-moz-appearance': 'textfield' }
                                        }}
                                    />
                                </Grid>
                                
                                <Grid item xs={6}>
                                    <FormControl fullWidth sx={{
                                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                                    }}>
                                        <InputLabel>Категория</InputLabel>
                                        <Select value={newProduct.productTypeId} label="Категория" onChange={(e) => setNewProduct({...newProduct, productTypeId: e.target.value})}>
                                            {types.map(t => <MenuItem key={t.productTypeId} value={t.productTypeId}>{t.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            
                                <Grid item xs={6}>
                                    <FormControl fullWidth sx={{
                                        '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                                    }}>
                                        <InputLabel>Бренд</InputLabel>
                                        <Select value={newProduct.brandId} label="Бренд" onChange={(e) => setNewProduct({...newProduct, brandId: e.target.value})}>
                                            {brands.map(b => <MenuItem key={b.brandId} value={b.brandId}>{b.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            
                            <TextField 
                                label="Ссылка на изображение" 
                                fullWidth
                                value={newProduct.imageUrl} 
                                onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' }
                                }}
                            />

                            <TextField 
                                label="Описание товара" 
                                fullWidth
                                multiline
                                rows={3}
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
                                            placeholder="XL, 42..."
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
                                            inputProps={{ min: 0 }}
                                            value={v.stockQuantity}
                                            onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                                            sx={{
                                                width: '120px',
                                                '& .MuiOutlinedInput-root': { color: '#fff !important', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#fff' } },
                                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6) !important' }, '& .MuiInputLabel-root.Mui-focused': { color: '#fff !important' }, '& input': { color: '#fff !important' },
                                                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                                                '& input[type=number]': { '-moz-appearance': 'textfield' }
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
                        </Box>

                        {/* КНОПКИ ДЕЙСТВИЯ КАРТОЧКИ */}
                        <Box sx={{ p: '16px 0 0 0', mt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 2 }}>
                            <Button variant="outlined" fullWidth onClick={handleClose} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                Отмена
                            </Button>
                            <Button variant="contained" fullWidth onClick={handleSubmit} sx={{ bgcolor: '#fff', color: '#000', fontWeight: 'bold', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#e0e0e0' } }}>
                                {isEdit ? "Сохранить" : "Добавить"}
                            </Button>
                        </Box>
                    </Paper>
                </Box>

            </Box>

            {/* МЕНЕДЖЕР БРЕНДОВ И КАТЕГОРИЙ (СЛОВАРЬ) — ОСТАЛСЯ МОДАЛЬНЫМ ОКНОМ */}
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

        </Box>
    );
};

export default Products;
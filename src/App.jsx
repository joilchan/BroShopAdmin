import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Login from './pages/Login';

const drawerWidth = 260;

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const handleUserUpdate = (updatedData) => {
    const freshUser = { ...user, ...updatedData };
    localStorage.setItem('adminUser', JSON.stringify(freshUser));
    setUser(freshUser);
  };

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        
        {/* Шапка сайта в стиле Glassmorphism */}
        <AppBar 
          position="fixed" 
          elevation={0}
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: 'rgba(20, 20, 20, 0.75)',
            backdropFilter: 'var(--card-blur)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '1.5px',
                color: 'var(--text-main)' 
              }}
            >
              BroShop
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                 <strong style={{ color: 'var(--text-main)' }}>{user.fullName || user.login}</strong>
              </Typography>
              
              {/* Аккуратная белая кнопка выхода */}
              <Button 
                variant="outlined" 
                size="small" 
                
                onClick={handleLogout}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Выйти
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Боковое меню навигации */}
        <Drawer 
          variant="permanent" 
          sx={{ 
            width: drawerWidth, 
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              background: 'rgba(15, 15, 15, 0.7)',
              backdropFilter: 'var(--card-blur)',
              borderRight: '1px solid var(--border-color)',
            } 
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <List sx={{ px: 1.5 }}>
              
              {/* Элемент: Учёт и статистика */}
              <ListItemButton 
                component={Link} 
                to="/"
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  color: 'var(--text-main)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#b39ddb',
                    '& .MuiListItemIcon-root': { color: '#b39ddb' }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'var(--text-muted)', minWidth: '40px' }}><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Учёт и статистика" primaryTypographyProps={{ fontSize: '15px', fontWeight: '500' }} />
              </ListItemButton>

              {/* Элемент: Товары */}
              <ListItemButton 
                component={Link} 
                to="/products"
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  color: 'var(--text-main)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#b39ddb',
                    '& .MuiListItemIcon-root': { color: '#b39ddb' }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'var(--text-muted)', minWidth: '40px' }}><ShoppingBagIcon /></ListItemIcon>
                <ListItemText primary="Товары" primaryTypographyProps={{ fontSize: '15px', fontWeight: '500' }} />
              </ListItemButton>

              {/* Элемент: Заказы */}
              <ListItemButton 
                component={Link} 
                to="/orders"
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  color: 'var(--text-main)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#b39ddb',
                    '& .MuiListItemIcon-root': { color: '#b39ddb' }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'var(--text-muted)', minWidth: '40px' }}><ReceiptLongIcon /></ListItemIcon>
                <ListItemText primary="Заказы" primaryTypographyProps={{ fontSize: '15px', fontWeight: '500' }} />
              </ListItemButton>

              {/* Элемент: Пользователи */}
              <ListItemButton 
                component={Link} 
                to="/users"
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  color: 'var(--text-main)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#b39ddb',
                    '& .MuiListItemIcon-root': { color: '#b39ddb' }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'var(--text-muted)', minWidth: '40px' }}><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Пользователи" primaryTypographyProps={{ fontSize: '15px', fontWeight: '500' }} />
              </ListItemButton>

              {/* Элемент: Мой Профиль */}
              <ListItemButton 
                component={Link} 
                to="/profile"
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  color: 'var(--text-main)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#b39ddb',
                    '& .MuiListItemIcon-root': { color: '#b39ddb' }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'var(--text-muted)', minWidth: '40px' }}><AccountCircleIcon /></ListItemIcon>
                <ListItemText primary="Мой Профиль" primaryTypographyProps={{ fontSize: '15px', fontWeight: '500' }} />
              </ListItemButton>

            </List>
          </Box>
        </Drawer>

        {/* Главная контентная область рабочей зоны */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 4, 
            mt: 8,
            minHeight: '100vh',
            boxSizing: 'border-box'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/users" element={<Users />} />
            <Route path="/profile" element={<Profile currentUser={user} onUserUpdate={handleUserUpdate} />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
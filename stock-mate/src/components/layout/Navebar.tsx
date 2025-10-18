import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import logo from '../../assets/warehouse.png';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { to: '/products', label: 'Products' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/customers', label: 'Customers' },
    { to: '/warehouse', label: 'Warehouse' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#1976d2',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
        }}
      >
        {/* Left: Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src={logo}
            alt="StockMate Logo"
            sx={{
              height: 34,
              width: 34,
              borderRadius: '6px',
              objectFit: 'contain',
              backgroundColor: 'white',
              p: 0.3,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              letterSpacing: 0.5,
              color: 'white',
            }}
          >
            StockMate
          </Typography>
        </Box>

        {/* Right: Nav Links */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                sx={{
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                  borderRadius: 0,
                  '&:hover': {
                    borderBottom: '2px solid #fff',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                {link.label}
              </Button>
            );
          })}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {user.name}
              </Typography>
              <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Customers from './pages/Customers';
import Navbar from './components/layout/Navebar';
import WarehousePage from './pages/Warehouse';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
// import Invoices from './pages/Invoices';
import Colors from './pages/Colors';
import Fibers from './pages/Fibers';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                  }}
                >
                  <Navbar />
                  <Box sx={{ width: '100%', maxWidth: '100%', p: 2, boxSizing: 'border-box' }}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/products" replace />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/warehouse" element={<WarehousePage />} />
                      {/* <Route path="/invoices" element={<Invoices />} /> */}
                      <Route path="/colors" element={<Colors />} />
                      <Route path="/fibers" element={<Fibers />} />
                      <Route path="/invoices" element={<Invoices />} />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

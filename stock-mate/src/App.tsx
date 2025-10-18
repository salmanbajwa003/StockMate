import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Navbar from './components/layout/Navebar';
import Warehouse from './pages/Warehouse';
import Products from './pages/Products';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

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
                <Navbar />
                <div className="p-4">
                  <Routes>
                    <Route path="/" element={<Navigate to="/products" replace />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/warehouse" element={<Warehouse />} />
                  </Routes>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Navbar from './components/layout/Navebar';
import Warehouse from './pages/Warehouse';
import Products from './pages/Products';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/warehouse" element={<Warehouse />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

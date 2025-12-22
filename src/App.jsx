import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './components/Register';
import CompleteProfile from './components/Auth/CompleteProfile';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import Products from './components/Products';
import Users from './components/Users';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Reports from './pages/Reports/Reports';
import DeliveryInvoice from './components/DeliveryInvoice';
import UpdateDeliveryQuantities from './components/UpdateDeliveryQuantities';
import PrintTest from './components/PrintTest';
import PWAInstallButton from './components/PWAInstallButton';
import OnlineStatus from './components/OnlineStatus';

import CustomersManagement from './components/CustomersManagement';
import CustomerLedger from './pages/CustomerLedger/CustomerLedger';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
              <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders/*" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="users" element={<Users />} />
              <Route path="customers" element={<CustomersManagement />} />
              <Route path="customers/:customerId/ledger" element={<CustomerLedger />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/ledger" element={<CustomerLedger />} />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<Reports />} />
              

            </Route>
            
            {/* فاکتور تحویل - بدون Layout برای چاپ بهتر */}
            <Route path="/delivery/invoice/:orderId" element={<DeliveryInvoice />} />
            
            {/* به‌روزرسانی مقادیر تحویل - برای ویزیتورها */}
            <Route path="/delivery/update/:orderId" element={<UpdateDeliveryQuantities />} />
            
            {/* تست چاپ - موقت */}
            <Route path="/print-test" element={<PrintTest />} />

            {/* مسیرهای قدیمی برای حفظ سازگاری */}
            <Route path="/delivery-invoice/:orderId" element={<DeliveryInvoice />} />
            <Route path="/update-delivery/:orderId" element={<UpdateDeliveryQuantities />} />
            <Route path="/update-delivery-quantities/:orderId" element={<UpdateDeliveryQuantities />} />
          </Routes>
          
          {/* PWA Components */}
          <OnlineStatus />
          <PWAInstallButton />
          
          {/* Toaster for notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
                textAlign: 'right'
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;

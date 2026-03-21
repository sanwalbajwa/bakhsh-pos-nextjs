import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />

                    {/* Admin Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/products"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <Products />
                            </ProtectedRoute>
                        }
                    />

                    {/* Pharmacist & Doctor Routes */}
                    <Route
                        path="/pos"
                        element={
                            <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
                                <div className="flex items-center justify-center h-screen bg-gray-50">
                                    <div className="text-center">
                                        <h1 className="text-3xl font-bold text-primary mb-2">POS System</h1>
                                        <p className="text-gray-500">Coming Soon</p>
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Redirect */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

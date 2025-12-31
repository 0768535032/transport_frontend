import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LogList from './components/LogList';
import LogForm from './components/LogForm';
import Login from './components/Login';
import Register from './components/Register';
import { isAuthenticated, clearAuthTokens } from './utils/auth';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthTokens();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="app-title">
        <h1>FMCSA Driver Daily Log</h1>
        <p>Digital Hours of Service compliance</p>
      </div>
      <nav className="app-nav">
        {isAuthenticated() ? (
          <>
            <button type="button" className="ghost-btn" onClick={() => navigate('/logs')}>
              Logs
            </button>
            <button type="button" className="ghost-btn" onClick={() => navigate('/logs/new')}>
              New Log
            </button>
            <button type="button" className="ghost-btn logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ghost-btn" onClick={() => navigate('/login')}>
              Login
            </button>
            <button type="button" className="ghost-btn" onClick={() => navigate('/register')}>
              Register
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

const RequireAuth = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <>
    <Header />
    <main className="app-main">
      <Routes>
        <Route path="/" element={<Navigate to="/logs" replace />} />
        <Route
          path="/logs"
          element={
            <RequireAuth>
              <LogList />
            </RequireAuth>
          }
        />
        <Route
          path="/logs/new"
          element={
            <RequireAuth>
              <LogForm />
            </RequireAuth>
          }
        />
        <Route
          path="/logs/:id"
          element={
            <RequireAuth>
              <LogForm />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </>
);

export default App;

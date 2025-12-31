import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logsAPI } from '../services/api';
import { clearAuthTokens } from '../utils/auth';

const LogList = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await logsAPI.list();
      setLogs(response.results || response);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        clearAuthTokens();
        navigate('/login');
      } else {
        setError('Failed to load logs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Driver's Daily Logs</h1>
        <div>
          <button className="btn btn-primary" onClick={() => navigate('/logs/new')} style={{ marginRight: '10px' }}>
            New Log
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {logs.length === 0 ? (
        <div className="card">
          <p>No logs found. Create your first daily log!</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Location</th>
                <th>End Location</th>
                <th>Carrier</th>
                <th>Vehicle ID</th>
                <th>Total Miles</th>
                <th>Driving Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.date)}</td>
                  <td>{log.start_location}</td>
                  <td>{log.end_location}</td>
                  <td>{log.carrier_name}</td>
                  <td>{log.vehicle_id}</td>
                  <td>{log.total_miles}</td>
                  <td>{log.total_driving_hours || 0}</td>
                  <td>
                    {log.is_submitted ? (
                      <span className="badge badge-success">Submitted</span>
                    ) : (
                      <span className="badge badge-warning">Draft</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                      onClick={() => navigate(`/logs/${log.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LogList;



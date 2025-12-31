import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logsAPI } from '../services/api';
import { clearAuthTokens } from '../utils/auth';

const STATUS_OPTIONS = [
  { value: 'off_duty', label: 'Off Duty' },
  { value: 'sleeper_berth', label: 'Sleeper Berth' },
  { value: 'driving', label: 'Driving' },
  { value: 'on_duty_not_driving', label: 'On Duty Not Driving' },
];

const LogForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_location: '',
    end_location: '',
    carrier_name: '',
    vehicle_id: '',
    total_miles: '',
    remarks: '',
    duty_status_entries: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchLog();
    }
  }, [id]);

  const fetchLog = async () => {
    try {
      const log = await logsAPI.get(id);
      setFormData({
        date: log.date,
        start_location: log.start_location,
        end_location: log.end_location,
        carrier_name: log.carrier_name,
        vehicle_id: log.vehicle_id,
        total_miles: log.total_miles,
        remarks: log.remarks || '',
        duty_status_entries: log.duty_status_entries || [],
      });
    } catch (err) {
      if (err.response?.status === 401) {
        clearAuthTokens();
        navigate('/login');
      } else {
        setError('Failed to load log. Please try again.');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleEntryChange = (index, field, value) => {
    const entries = [...formData.duty_status_entries];
    entries[index] = {
      ...entries[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      duty_status_entries: entries,
    });
    setError('');
  };

  const addEntry = () => {
    setFormData({
      ...formData,
      duty_status_entries: [
        ...formData.duty_status_entries,
        {
          status: 'off_duty',
          start_time: '00:00',
          end_time: '00:00',
        },
      ],
    });
  };

  const removeEntry = (index) => {
    const entries = formData.duty_status_entries.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      duty_status_entries: entries,
    });
  };

  const calculateCoverage = () => {
    // Simple client-side check - server will do full validation
    const totalMinutes = formData.duty_status_entries.reduce((sum, entry) => {
      const start = entry.start_time.split(':').map(Number);
      const end = entry.end_time.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      let endMinutes = end[0] * 60 + end[1];
      
      if (endMinutes < startMinutes) {
        // Midnight crossover
        endMinutes += 24 * 60;
      }
      
      return sum + (endMinutes - startMinutes);
    }, 0);

    return totalMinutes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        total_miles: parseFloat(formData.total_miles),
        duty_status_entries: formData.duty_status_entries.map((entry) => ({
          status: entry.status,
          start_time: entry.start_time,
          end_time: entry.end_time,
        })),
      };

      if (isEdit) {
        await logsAPI.update(id, submitData);
        setSuccess('Log updated successfully!');
      } else {
        const newLog = await logsAPI.create(submitData);
        setSuccess('Log created successfully!');
        setTimeout(() => {
          navigate(`/logs/${newLog.id}`);
        }, 1500);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        clearAuthTokens();
        navigate('/login');
      } else {
        const errorData = err.response?.data;
        if (errorData) {
          if (errorData.duty_status_entries) {
            setError(Array.isArray(errorData.duty_status_entries) 
              ? errorData.duty_status_entries[0] 
              : errorData.duty_status_entries);
          } else {
            setError(
              typeof errorData === 'string' 
                ? errorData 
                : Object.values(errorData)[0]?.[0] || 'Failed to save log.'
            );
          }
        } else {
          setError('Failed to save log. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLog = async () => {
    if (!window.confirm('Are you sure you want to submit this log? It will become permanent and cannot be edited.')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await logsAPI.submit(id);
      setSuccess('Log submitted successfully!');
      setTimeout(() => {
        navigate('/logs');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit log.');
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = calculateCoverage();
  const coverageHours = (totalMinutes / 60).toFixed(2);
  const isComplete = totalMinutes === 1440;

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/logs')}>
          ← Back to Logs
        </button>
      </div>

      <div className="card">
        <h2>{isEdit ? 'Edit Daily Log' : 'Create New Daily Log'}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={isEdit}
              />
            </div>

            <div className="form-group">
              <label htmlFor="total_miles">Total Miles *</label>
              <input
                type="number"
                id="total_miles"
                name="total_miles"
                value={formData.total_miles}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="start_location">Start Location *</label>
              <input
                type="text"
                id="start_location"
                name="start_location"
                value={formData.start_location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_location">End Location *</label>
              <input
                type="text"
                id="end_location"
                name="end_location"
                value={formData.end_location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="carrier_name">Carrier Name *</label>
              <input
                type="text"
                id="carrier_name"
                name="carrier_name"
                value={formData.carrier_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="vehicle_id">Vehicle/Unit ID *</label>
              <input
                type="text"
                id="vehicle_id"
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <hr style={{ margin: '30px 0' }} />

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Duty Status Entries</h3>
              <button type="button" className="btn btn-primary" onClick={addEntry}>
                + Add Entry
              </button>
            </div>

            <div style={{ 
              padding: '10px', 
              backgroundColor: isComplete ? '#d4edda' : '#fff3cd',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <strong>Coverage: {coverageHours} hours / 24.00 hours</strong>
              {isComplete ? (
                <span style={{ color: '#155724', marginLeft: '10px' }}>✓ Complete</span>
              ) : (
                <span style={{ color: '#856404', marginLeft: '10px' }}>
                  ⚠ {((1440 - totalMinutes) / 60).toFixed(2)} hours remaining
                </span>
              )}
            </div>

            {formData.duty_status_entries.length === 0 ? (
              <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                No entries yet. Add your first duty status entry to begin.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.duty_status_entries.map((entry, index) => {
                      const start = entry.start_time.split(':').map(Number);
                      const end = entry.end_time.split(':').map(Number);
                      const startMinutes = start[0] * 60 + start[1];
                      let endMinutes = end[0] * 60 + end[1];
                      if (endMinutes < startMinutes) {
                        endMinutes += 24 * 60;
                      }
                      const duration = ((endMinutes - startMinutes) / 60).toFixed(2);

                      return (
                        <tr key={index}>
                          <td>
                            <select
                              value={entry.status}
                              onChange={(e) => handleEntryChange(index, 'status', e.target.value)}
                              style={{ width: '100%', padding: '5px' }}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="time"
                              value={entry.start_time}
                              onChange={(e) => handleEntryChange(index, 'start_time', e.target.value)}
                              style={{ width: '100%', padding: '5px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={entry.end_time}
                              onChange={(e) => handleEntryChange(index, 'end_time', e.target.value)}
                              style={{ width: '100%', padding: '5px' }}
                            />
                          </td>
                          <td>{duration} hrs</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: '5px 10px', fontSize: '14px' }}
                              onClick={() => removeEntry(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Log' : 'Create Log'}
            </button>
            {isEdit && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSubmitLog}
                disabled={loading || isComplete === false}
              >
                Submit Log (Make Permanent)
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/logs')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogForm;



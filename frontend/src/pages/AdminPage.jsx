import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { apiUrl } from '../config';
import './AdminPage.css';

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'];

function getStoredToken() {
  return localStorage.getItem('diseaseRadarAdminToken') || '';
}

function getStoredAdminName() {
  return localStorage.getItem('diseaseRadarAdminName') || 'Doctor Admin';
}

export default function AdminPage() {
  const [token, setToken] = useState(getStoredToken());
  const [adminName, setAdminName] = useState(getStoredAdminName());
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('pending');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({});

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  const loadReports = async (selectedStatus = status, authToken = token) => {
    if (!authToken) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/admin/reports?status=${selectedStatus}`), {
        headers: {
          'x-admin-token': authToken,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to fetch reports.');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes('authentication')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadReports(status, token);
    }
  }, [status, token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          admin_name: adminName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed.');
      }

      localStorage.setItem('diseaseRadarAdminToken', data.token);
      localStorage.setItem('diseaseRadarAdminName', data.admin_name);
      setToken(data.token);
      setAdminName(data.admin_name);
      setPassword('');
      loadReports(status, data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('diseaseRadarAdminToken');
    setToken('');
    setReports([]);
  };

  const updateDraft = (reportId, patch) => {
    setFormState((prev) => ({
      ...prev,
      [reportId]: {
        ...(prev[reportId] || {}),
        ...patch,
      },
    }));
  };

  const reviewReport = async (reportId, action) => {
    const draft = formState[reportId] || {};

    try {
      const response = await fetch(apiUrl(`/api/admin/reports/${reportId}/review`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          action,
          verified_disease: draft.verifiedDisease || '',
          verification_notes: draft.notes || '',
          reviewed_by: adminName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to review report.');
      }

      setFormState((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      loadReports(status);
    } catch (err) {
      setError(err.message);
    }
  };

  const openDocument = async (reportId, fileName) => {
    try {
      const response = await fetch(apiUrl(`/api/admin/reports/${reportId}/document`), {
        headers: {
          'x-admin-token': token,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Unable to open document.');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      setError(`${fileName || 'Document'}: ${err.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page fade-in">
        <div className="container admin-shell">
          <Card className="admin-login-card" glow>
            <h1>Doctor Review Console</h1>
            <p>Approve or reject submitted cases before they appear on the public map and analytics dashboard.</p>
            <form className="admin-login-form" onSubmit={handleLogin}>
              <label className="admin-field">
                <span>Reviewer Name</span>
                <input value={adminName} onChange={(event) => setAdminName(event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Admin Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter doctor/admin password"
                />
              </label>
              {error && <div className="admin-error">{error}</div>}
              <Button type="submit" variant="primary" size="lg" glow>
                Sign In
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page fade-in">
      <div className="container admin-shell">
        <div className="admin-toolbar">
          <div>
            <h1>Doctor Review Console</h1>
            <p>Public dashboards consume approved cases only.</p>
          </div>
          <div className="admin-toolbar-actions">
            <span className="admin-badge">{adminName}</span>
            <Button type="button" variant="secondary" onClick={() => loadReports(status)}>
              Refresh
            </Button>
            <Button type="button" variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="admin-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-tab ${status === tab ? 'active' : ''}`}
              onClick={() => setStatus(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <Card className="admin-loading-card">
            <p>Loading reports...</p>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="admin-loading-card">
            <p>No reports found for the selected status.</p>
          </Card>
        ) : (
          <div className="admin-report-list">
            {reports.map((report) => {
              const draft = formState[report.id] || {};
              return (
                <Card key={report.id} className="admin-report-card" glow>
                  <div className="admin-report-header">
                    <div>
                      <h3>Case #{report.id}</h3>
                      <p>
                        Submitted {report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                    <span className={`admin-status admin-status-${report.review_status}`}>
                      {report.review_status}
                    </span>
                  </div>

                  <div className="admin-report-grid">
                    <div>
                      <strong>Symptoms</strong>
                      <p>{report.symptoms.join(', ') || 'No symptoms recorded'}</p>
                    </div>
                    <div>
                      <strong>Location</strong>
                      <p>{report.location_label || report.pincode || report.cell || 'Unknown'}</p>
                    </div>
                    <div>
                      <strong>Onset Date</strong>
                      <p>{report.onset_date || 'Unknown'}</p>
                    </div>
                    <div>
                      <strong>Current Disease Tag</strong>
                      <p>{report.verified_disease || 'Not verified yet'}</p>
                    </div>
                  </div>

                  <div className="admin-doc-row">
                    <strong>Medical Report</strong>
                    {report.has_medical_report ? (
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => openDocument(report.id, report.report_file_name)}
                      >
                        Open {report.report_file_name}
                      </button>
                    ) : (
                      <span>No file uploaded</span>
                    )}
                  </div>

                  <div className="admin-review-form">
                    <label className="admin-field">
                      <span>Verified Disease</span>
                      <input
                        value={draft.verifiedDisease ?? report.verified_disease ?? ''}
                        onChange={(event) => updateDraft(report.id, { verifiedDisease: event.target.value })}
                        placeholder="Example: Dengue, Influenza, Viral Fever"
                      />
                    </label>
                    <label className="admin-field">
                      <span>Review Notes</span>
                      <textarea
                        rows="3"
                        value={draft.notes ?? report.verification_notes ?? ''}
                        onChange={(event) => updateDraft(report.id, { notes: event.target.value })}
                        placeholder="Reason for approval/rejection"
                      />
                    </label>
                  </div>

                  <div className="admin-review-actions">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => reviewReport(report.id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => reviewReport(report.id, 'reject')}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

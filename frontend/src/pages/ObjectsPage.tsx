import React, { useState } from 'react';
import { Satellite, DebrisObject } from '../types';
import { deleteSatellite, deleteDebris, uploadDebrisCSV } from '../services/api';
import { Search, Trash2, Upload, Play, FileText } from 'lucide-react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

interface ObjectsPageProps {
  satellites: Satellite[];
  debrisList: DebrisObject[];
  onRefreshData: () => void;
  onAnalyzeObject: (sat: Satellite) => void;
}

export const ObjectsPage: React.FC<ObjectsPageProps> = ({
  satellites,
  debrisList,
  onRefreshData,
  onAnalyzeObject,
}) => {
  const [activeTab, setActiveTab] = useState<'satellites' | 'debris'>('satellites');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const filteredSatellites = satellites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDebris = debrisList.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteSat = async (id: string) => {
    if (window.confirm(`Remove satellite '${id}' from catalog?`)) {
      await deleteSatellite(id);
      onRefreshData();
    }
  };

  const handleDeleteDebris = async (id: string) => {
    if (window.confirm(`Delete debris '${id}' from catalog?`)) {
      await deleteDebris(id);
      onRefreshData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadStatus('Validating & uploading CSV...');
    try {
      const res = await uploadDebrisCSV(file);
      if (res.success) {
        setUploadStatus(`Imported ${res.imported_count} debris items successfully!`);
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatus(null);
          onRefreshData();
        }, 800);
      } else {
        setUploadStatus(`Errors: ${res.errors.map((err) => `Row ${err.row}: ${err.message}`).join('; ')}`);
      }
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 20px 60px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <DisclaimerBanner />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A' }}>
            Orbital Objects Catalog
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Primary assets and space debris database tracked under ISRO SSA program
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="liquid-button liquid-button-primary"
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('satellites')}
            style={{
              background: activeTab === 'satellites' ? '#EA580C' : '#FFFFFF',
              border: activeTab === 'satellites' ? '1px solid #C2410C' : '1px solid #CBD5E1',
              color: activeTab === 'satellites' ? '#FFFFFF' : '#475569',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'satellites' ? '0 2px 6px rgba(234, 88, 12, 0.2)' : 'none',
            }}
          >
            Satellites ({satellites.length})
          </button>
          <button
            onClick={() => setActiveTab('debris')}
            style={{
              background: activeTab === 'debris' ? '#EA580C' : '#FFFFFF',
              border: activeTab === 'debris' ? '1px solid #C2410C' : '1px solid #CBD5E1',
              color: activeTab === 'debris' ? '#FFFFFF' : '#475569',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'debris' ? '0 2px 6px rgba(234, 88, 12, 0.2)' : 'none',
            }}
          >
            Debris Objects ({debrisList.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="orbital-input"
            style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
          />
          <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '11px' }} />
        </div>
      </div>

      {/* Table Container */}
      <div className="analytical-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <table className="analytical-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Designation / Name</th>
              <th>Altitude</th>
              <th>Inclination</th>
              <th>Period</th>
              <th>Source / Registry</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'satellites' ? (
              filteredSatellites.map((sat) => (
                <tr key={sat.id}>
                  <td className="text-mono" style={{ color: '#0F172A', fontWeight: 700 }}>
                    {sat.id}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{sat.name}</td>
                  <td className="text-mono">{sat.altitude_km} km</td>
                  <td className="text-mono">{sat.inclination_deg}°</td>
                  <td className="text-mono">{sat.period_min} min</td>
                  <td style={{ color: '#64748B', fontSize: '0.78rem' }}>{sat.source}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onAnalyzeObject(sat)}
                        className="liquid-button"
                        style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                        title="Screen Collision Risk"
                      >
                        <Play size={12} color="#EA580C" />
                        Analyze
                      </button>
                      <button
                        onClick={() => handleDeleteSat(sat.id)}
                        className="liquid-button"
                        style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#DC2626' }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredDebris.map((deb) => (
                <tr key={deb.id}>
                  <td className="text-mono" style={{ color: '#EA580C', fontWeight: 700 }}>
                    {deb.id}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{deb.name}</td>
                  <td className="text-mono">{deb.altitude_km} km</td>
                  <td className="text-mono">{deb.inclination_deg}°</td>
                  <td className="text-mono">{deb.period_min} min</td>
                  <td style={{ color: '#64748B', fontSize: '0.78rem' }}>{deb.source}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteDebris(deb.id)}
                      className="liquid-button"
                      style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#DC2626' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CSV Import Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="analytical-panel"
            style={{ width: '100%', maxWidth: '520px', padding: '28px', backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Import Debris Catalog CSV
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '18px' }}>
              Upload an orbital ephemeris CSV with columns: object_id, altitude_km, inclination_deg, period_min, phase_deg.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ fontSize: '0.82rem', color: '#334155' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <a
                href="/sample_debris_catalog.csv"
                download
                style={{ fontSize: '0.8rem', color: '#EA580C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FileText size={14} />
                Download Sample CSV Template
              </a>
            </div>

            {uploadStatus && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8rem',
                  color: uploadStatus.includes('successfully') ? '#16A34A' : '#DC2626',
                  fontWeight: 500,
                  marginBottom: '18px',
                }}
              >
                {uploadStatus}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                className="liquid-button"
                style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.82rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

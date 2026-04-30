import { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import { API_BASE_URL } from '../config';
import './MapPage.css';

export default function MapPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const mapIframeRef = useRef(null);
  const mapUrl = `/map.html?apiBaseUrl=${encodeURIComponent(API_BASE_URL)}`;

  const commonSymptoms = [
    'Fever',
    'Cough',
    'Shortness of Breath',
    'Headache',
    'Body Aches',
    'Fatigue',
  ];

  useEffect(() => {
    // Initialize symptom visibility states
    const initialStates = {};
    commonSymptoms.forEach((symptom) => {
      initialStates[symptom] = true; // All visible by default
    });
    setSelectedSymptoms(initialStates);
  }, []);

  const toggleSymptomLayer = (symptom) => {
    setSelectedSymptoms((prev) => {
      const newState = {
        ...prev,
        [symptom]: !prev[symptom],
      };
      // Send message to iframe
      if (mapIframeRef.current) {
        mapIframeRef.current.contentWindow.postMessage(
          {
            type: 'FILTER_SYMPTOMS',
            visibleSymptoms: Object.keys(newState).filter(s => newState[s])
          },
          '*'
        );
      }
      return newState;
    });
  };

  const toggleAllLayers = () => {
    const allVisible = Object.values(selectedSymptoms).every((v) => v);
    const newState = {};
    commonSymptoms.forEach((symptom) => {
      newState[symptom] = !allVisible;
    });
    setSelectedSymptoms(newState);
    
    // Send message to iframe
    if (mapIframeRef.current) {
      mapIframeRef.current.contentWindow.postMessage(
        {
          type: 'FILTER_SYMPTOMS',
          visibleSymptoms: Object.keys(newState).filter(s => newState[s])
        },
        '*'
      );
    }
  };

  return (
    <div className="map-page fade-in">
      <div className="map-container">
        {/* Map Iframe */}
        <div className="map-wrapper">
          <iframe
            ref={mapIframeRef}
            src={mapUrl}
            className="map-iframe"
            title="Interactive Symptom Map"
            loading="lazy"
          />
        </div>

        {/* Control Sidebar */}
        <aside className="map-sidebar">
          <Card glow className="sidebar-card">
            <div className="sidebar-header">
              <h3>Symptom Filters</h3>
              <button
                className="toggle-all-btn"
                onClick={toggleAllLayers}
                title="Toggle all symptom layers"
              >
                {Object.values(selectedSymptoms).every((v) => v) ? 'Hide All' : 'Show All'}
              </button>
            </div>

            <div className="layers-list">
              {commonSymptoms.map((symptom) => (
                <label key={symptom} className="layer-item">
                  <input
                    type="checkbox"
                    checked={selectedSymptoms[symptom] || false}
                    onChange={() => toggleSymptomLayer(symptom)}
                  />
                  <span className="layer-name">{symptom}</span>
                  <span className="layer-dot"></span>
                </label>
              ))}
            </div>

            <div className="sidebar-divider"></div>

            <div className="sidebar-info">
              <h4>Map Information</h4>
              <p>
                This interactive map shows the geographic distribution of doctor-approved cases across different regions.
                Use the controls to toggle symptom layers and explore verified patterns.
              </p>
              <ul className="info-list">
                <li>🔴 Red: High concentration</li>
                <li>🟠 Orange: Medium concentration</li>
                <li>🟡 Yellow: Low concentration</li>
                <li>🟢 Green: Minimal reports</li>
              </ul>
            </div>
          </Card>
        </aside>
      </div>

      {/* Info Section Below */}
      <div className="map-info-section">
        <div className="container">
          <h2>About This Map</h2>
          <div className="info-grid">
            <Card className="info-card">
              <h3>Real-Time Data</h3>
              <p>
                The map updates as reviewed cases are approved, providing a moderated view of disease spread patterns.
              </p>
            </Card>
            <Card className="info-card">
              <h3>Privacy Protected</h3>
              <p>
                Your location is discretized into geographic cells to protect privacy while maintaining data accuracy for analysis.
              </p>
            </Card>
            <Card className="info-card">
              <h3>Symptom Tracking</h3>
              <p>
                Track specific symptoms across regions to identify clusters and potential outbreaks early.
              </p>
            </Card>
            <Card className="info-card">
              <h3>Data-Driven Insights</h3>
              <p>
                Use these insights to understand disease dynamics and support public health decision-making.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { apiUrl } from '../config';
import './ReportPage.css';

const QUICK_SYMPTOMS = [
  'Fever',
  'Cough',
  'Shortness of Breath',
  'Headache',
  'Body Aches',
  'Fatigue',
  'Chills',
  'Sore Throat',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Congestion',
  'Sneezing'
];

const SEARCHABLE_SYMPTOMS = [
  ...QUICK_SYMPTOMS,
  'Chest Pain',
  'Runny Nose',
  'Loss of Taste',
  'Loss of Smell',
  'Dizziness',
  'Abdominal Pain',
  'Skin Rash',
  'Joint Pain',
  'Back Pain',
  'Ear Pain',
  'Burning Urination',
  'Night Sweats',
  'Wheezing',
  'Palpitations',
  'Constipation'
];

const PINCODE_REGEX = /^\d{6}$/;

export default function ReportPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomQuery, setSymptomQuery] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [medicalReportFile, setMedicalReportFile] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Manual pincode mode is active.');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [submissionMeta, setSubmissionMeta] = useState(null);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((item) => item !== symptom)
        : [...prev, symptom]
    );
  };

  const addSymptomFromSearch = (symptom) => {
    const normalized = symptom.trim();
    if (!normalized) {
      return;
    }
    setSelectedSymptoms((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setSymptomQuery('');
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms((prev) => prev.filter((item) => item !== symptom));
  };

  const matchingSymptoms = SEARCHABLE_SYMPTOMS.filter((symptom) => {
    const query = symptomQuery.trim().toLowerCase();
    if (!query) {
      return false;
    }
    return symptom.toLowerCase().includes(query) && !selectedSymptoms.includes(symptom);
  }).slice(0, 8);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setUseCurrentLocation(false);
      setCoordinates(null);
      setLocationStatus('Browser location is not supported on this device.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Fetching your current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setUseCurrentLocation(true);
        setLocationStatus('Current location ready. Hospital lookup will use your coordinates.');
        setIsLocating(false);
      },
      () => {
        setUseCurrentLocation(false);
        setCoordinates(null);
        setLocationStatus('Location permission denied. Enter a 6-digit pincode manually.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleLocationModeChange = (event) => {
    const enabled = event.target.checked;
    setUseCurrentLocation(enabled);

    if (enabled) {
      requestCurrentLocation();
    } else {
      setCoordinates(null);
      setLocationStatus('Manual pincode mode is active.');
    }
  };

  const handlePincodeChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setSelectedPincode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedSymptoms.length === 0) {
      setErrorMessage('Please select at least one symptom');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    if ((!useCurrentLocation || !coordinates) && !PINCODE_REGEX.test(selectedPincode)) {
      setErrorMessage('Please enter a valid 6-digit pincode or use your current location.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    if (!medicalReportFile) {
      setErrorMessage('Please upload a medical report or prescription for doctor verification.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('symptoms_payload', JSON.stringify(selectedSymptoms.map((symptom) => symptom.toLowerCase())));
      formData.append('pincode', selectedPincode || '');
      formData.append('onset_date_text', new Date().toISOString().split('T')[0]);
      if (useCurrentLocation && coordinates?.latitude != null && coordinates?.longitude != null) {
        formData.append('latitude', String(coordinates.latitude));
        formData.append('longitude', String(coordinates.longitude));
      }
      formData.append('medical_report', medicalReportFile);

      const response = await fetch(apiUrl('/api/report'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setShowSuccess(true);
        setTriageResult(data.triage || null);
        setSubmissionMeta({
          reportId: data.id,
          reviewStatus: data.review_status,
          requiresAdminReview: data.requires_admin_review,
        });
        setSelectedSymptoms([]);
        setMedicalReportFile(null);
        setTimeout(() => setShowSuccess(false), 4000);
      } else {
        const error = await response.json();
        setErrorMessage(error.detail || 'Failed to submit report');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    } catch (err) {
      setErrorMessage(`Error submitting report: ${err.message}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-page fade-in">
      <div className="container">
        <div className="report-header">
          <h1>Submit A Case For Verification</h1>
          <p>Upload supporting medical evidence. Only doctor-approved cases are published to public maps and analytics.</p>
        </div>

        <Card className="form-card" glow>
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-section">
              <label className="section-label">
                <span>Symptoms</span>
                <span className="required-asterisk">*</span>
              </label>
              <div className="symptom-search-box">
                <input
                  type="text"
                  value={symptomQuery}
                  onChange={(event) => setSymptomQuery(event.target.value)}
                  className="cell-select symptom-search-input"
                  placeholder="Search symptoms like chest pain, rash, dizziness..."
                />
                {symptomQuery.trim() && (
                  <div className="symptom-search-results">
                    {matchingSymptoms.length > 0 ? (
                      matchingSymptoms.map((symptom) => (
                        <button
                          key={symptom}
                          type="button"
                          className="symptom-search-result"
                          onClick={() => addSymptomFromSearch(symptom)}
                        >
                          {symptom}
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        className="symptom-search-result"
                        onClick={() => addSymptomFromSearch(symptomQuery)}
                      >
                        Add custom symptom: "{symptomQuery.trim()}"
                      </button>
                    )}
                  </div>
                )}
              </div>
              {selectedSymptoms.length > 0 && (
                <div className="selected-symptoms-list">
                  {selectedSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      className="selected-symptom-pill"
                      onClick={() => removeSymptom(symptom)}
                    >
                      {symptom} <span>x</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="symptoms-grid">
                {QUICK_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    className={`symptom-chip ${selectedSymptoms.includes(symptom) ? 'active' : ''}`}
                    onClick={() => toggleSymptom(symptom)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => {}}
                      aria-label={symptom}
                      hidden
                    />
                    {symptom}
                  </button>
                ))}
              </div>
              <p className="helper-text">
                Search any symptom or use the quick picks below. Selected: {selectedSymptoms.length} {selectedSymptoms.length === 1 ? 'symptom' : 'symptoms'}
              </p>
            </div>

            <div className="form-section">
              <label className="section-label">
                <span>Medical Report</span>
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="cell-select"
                onChange={(event) => setMedicalReportFile(event.target.files?.[0] || null)}
              />
              <p className="helper-text">
                Upload a lab report, prescription, or doctor note for admin review.
              </p>
              {medicalReportFile && (
                <div className="location-status location-ready">
                  Attached file: {medicalReportFile.name}
                </div>
              )}
            </div>

            <div className="form-section">
              <label className="section-label">
                <span>Location Mode</span>
                <span className="required-asterisk">*</span>
              </label>
              <label className="location-toggle">
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={handleLocationModeChange}
                />
                <span>Use my current location for nearby hospital lookup</span>
              </label>
              <p className="helper-text">
                Browser location is more accurate than manual pincode selection.
              </p>
              {locationStatus && (
                <div className={`location-status ${useCurrentLocation && coordinates ? 'location-ready' : ''}`}>
                  {locationStatus}
                </div>
              )}
              {useCurrentLocation && coordinates && (
                <div className="location-coordinates">
                  Lat {coordinates.latitude.toFixed(4)} | Lon {coordinates.longitude.toFixed(4)}
                </div>
              )}
            </div>

            <div className="form-section">
              <label htmlFor="pincode-input" className="section-label">
                <span>Fallback Location (Pincode)</span>
              </label>
              <input
                id="pincode-input"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={selectedPincode}
                onChange={handlePincodeChange}
                className="cell-select"
                placeholder="Enter 6-digit pincode"
                disabled={useCurrentLocation && Boolean(coordinates)}
              />
              <p className="helper-text">
                Enter any 6-digit Indian pincode. This is used if browser location is unavailable or denied.
              </p>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={requestCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? 'Locating...' : 'Refresh Location'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                glow
              >
                {isSubmitting ? 'Submitting...' : 'Submit For Review'}
              </Button>
            </div>
          </form>
        </Card>

        {showSuccess && (
          <div className="popup success-popup">
            <div className="popup-icon">Done</div>
            <div className="popup-title">Report Submitted</div>
            <div className="popup-message">
              The case is now pending doctor/admin verification.
            </div>
          </div>
        )}

        {showError && (
          <div className="popup error-popup">
            <div className="popup-icon">Error</div>
            <div className="popup-title">Submission Failed</div>
            <div className="popup-message">{errorMessage}</div>
          </div>
        )}

        {submissionMeta && (
          <Card className="triage-card" glow>
            <h3>Verification Status</h3>
            <p className="recommendation-text">
              Report #{submissionMeta.reportId} is currently <strong>{submissionMeta.reviewStatus}</strong>.
              Only approved cases are shown on the map and used in analytics.
            </p>
          </Card>
        )}

        {triageResult && (
          <section className="triage-results">
            <div className="triage-header">
              <h2>Provisional Triage Result</h2>
              <span className={`urgency-pill urgency-${triageResult.urgency_level.toLowerCase()}`}>
                {triageResult.urgency_level} urgency
              </span>
            </div>

            <div className="triage-grid">
              <Card className="triage-card" glow>
                <h3>Likely Conditions</h3>
                <div className="prediction-list">
                  {triageResult.predictions.map((prediction) => (
                    <div key={prediction.disease} className="prediction-item">
                      <div className="prediction-topline">
                        <strong>{prediction.disease}</strong>
                        <span className={`confidence-badge confidence-${prediction.confidence_band.toLowerCase()}`}>
                          {prediction.confidence_band} confidence
                        </span>
                      </div>
                      <p>{prediction.category}</p>
                      <small>Matched symptoms: {prediction.matched_symptoms.join(', ')}</small>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="triage-card" glow>
                <h3>Recommended Action</h3>
                <div className="recommendation-box">
                  <div className="urgency-score">Urgency score: {triageResult.urgency_score}/100</div>
                  <div className="urgency-score">
                    Hospital routing mode: {triageResult.location_mode === 'coordinates' ? 'Current location' : 'Pincode fallback'}
                  </div>
                  <div className="urgency-score">
                    Resolved search area: {triageResult.hospital_lookup_pincode}
                  </div>
                  <p className="recommendation-text">{triageResult.recommendation}</p>
                  <ul className="reasoning-list">
                    {triageResult.reasoning.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>

            <Card className="triage-card triage-hospitals" glow>
              <div className="triage-section-header">
                <h3>Nearby Hospitals and Clinics</h3>
                <span className={`lookup-source lookup-${triageResult.hospital_lookup_source}`}>
                  {triageResult.hospital_lookup_source === 'live'
                    ? `Live lookup for ${triageResult.hospital_lookup_pincode}`
                    : triageResult.hospital_lookup_source === 'fallback'
                      ? `Fallback directory for ${triageResult.hospital_lookup_pincode}`
                      : 'Location unavailable'}
                </span>
              </div>
              <div className="hospital-list">
                {triageResult.hospitals.length > 0 ? (
                  triageResult.hospitals.map((hospital) => (
                    <div key={`${hospital.name}-${hospital.address}`} className="hospital-item">
                      <div className="hospital-topline">
                        <strong>{hospital.name}</strong>
                        <span className="facility-badge">{hospital.facility_type}</span>
                      </div>
                      {hospital.address ? (
                        <p>{hospital.address}</p>
                      ) : (
                        <p>Local address details were not listed in the map data.</p>
                      )}
                      <small>
                        {[
                          hospital.specialty,
                          hospital.phone,
                          hospital.pincode ? `Pincode ${hospital.pincode}` : null,
                        ].filter(Boolean).join(' | ')}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="hospital-empty-state">
                    No verified hospitals were found for the resolved search area. Try current location access, check the pincode, or try a nearby major pincode.
                  </div>
                )}
              </div>
              {triageResult.hospital_lookup_reason && (
                <p className="helper-text">
                  Lookup status: {triageResult.hospital_lookup_reason}
                </p>
              )}
              {triageResult.hospital_lookup_error && triageResult.hospital_lookup_source !== 'live' && (
                <p className="helper-text">
                  Technical note: {triageResult.hospital_lookup_error}
                </p>
              )}
              <p className="disclaimer">{triageResult.disclaimer}</p>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

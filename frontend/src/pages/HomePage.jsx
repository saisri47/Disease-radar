import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SymptomBarChart from '../ui/SymptomBarChart'
import { apiUrl } from '../config'
import './HomePage.css'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalReports: 0,
    topSymptoms: [],
    riskIndex: 0,
    totalSymptoms: 0,
    heatmapData: [],
    recentAlerts: ['Cluster detected in Downtown', 'Rising GI symptoms citywide']
  })

  const [reports, setReports] = useState([])
  const [rawReports, setRawReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState(null)
  const [locationRisks, setLocationRisks] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [userAreaKey, setUserAreaKey] = useState(null)
  const [userAreaLabel, setUserAreaLabel] = useState('Current area')
  const [symptomChartData, setSymptomChartData] = useState([])

  const getReportLocationLabel = (report) => {
    if (report.pincode) return report.pincode
    if (report.location_label && report.location_label !== 'Unknown') return report.location_label
    if (report.latitude != null && report.longitude != null) {
      return `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`
    }
    if (report.cell) return report.cell
    return 'Unknown'
  }

  const getReportLocationClusterKey = (report) => {
    if (report.pincode) return report.pincode
    if (report.latitude != null && report.longitude != null) {
      const lat = Number(report.latitude)
      const lon = Number(report.longitude)
      const gridSize = 0.01
      const clusteredLat = (Math.round(lat / gridSize) * gridSize).toFixed(3)
      const clusteredLon = (Math.round(lon / gridSize) * gridSize).toFixed(3)
      return `${clusteredLat}, ${clusteredLon}`
    }
    if (report.location_label && report.location_label !== 'Unknown') return report.location_label
    if (report.cell) return report.cell
    return 'Unknown'
  }

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const location = { latitude, longitude }
          setUserLocation(location)
          setUserAreaKey(getReportLocationClusterKey(location))

          fetch(apiUrl(`/api/location/resolve?latitude=${latitude}&longitude=${longitude}`))
            .then(response => response.json())
            .then(data => {
              if (data?.display_name) {
                setUserAreaLabel(data.display_name)
              }
            })
            .catch(() => {
              setUserAreaLabel('Current area')
            })
        },
        (error) => {
          console.log('Geolocation permission denied or error:', error)
          setUserAreaLabel('Location unavailable')
        }
      )
    } else {
      setUserAreaLabel('Location unavailable')
    }
  }, [])

  // Calculate location-based risk index
  const calculateLocationRisks = (reports, symptomCounts) => {
    const severeSymptoms = ['fever', 'shortness of breath', 'severe cough', 'chest pain']
    const pincodeRisks = {}

    // Group reports by best available location label
    reports.forEach(report => {
      const locationKey = getReportLocationClusterKey(report)
      if (!pincodeRisks[locationKey]) {
        pincodeRisks[locationKey] = {
          pincode: locationKey,
          reportCount: 0,
          severeCount: 0,
          symptoms: {}
        }
      }
      pincodeRisks[locationKey].reportCount += 1
      report.symptoms.forEach(symptom => {
        pincodeRisks[locationKey].symptoms[symptom] = (pincodeRisks[locationKey].symptoms[symptom] || 0) + 1
        if (severeSymptoms.includes(symptom.toLowerCase())) {
          pincodeRisks[locationKey].severeCount += 1
        }
      })
    })

    // Calculate risk score for each pincode using weighted formula
    // Risk_Index = (Report_Density × 0.3) + (Severe_Symptom_Score × 0.4) + (Symptom_Diversity × 0.3)
    const locationRiskArray = Object.values(pincodeRisks).map(location => {
      const reportDensity = Math.min(location.reportCount / 5, 3)
      const severeScore = Math.min(location.severeCount / 3, 4)
      const uniqueSymptoms = Object.keys(location.symptoms).length
      const diversityScore = Math.min(uniqueSymptoms / 10, 2)
      
      // Apply weighted formula
      const riskScore = Math.min(
        (reportDensity * 0.3) + (severeScore * 0.4) + (diversityScore * 0.3),
        10
      )
      
      return {
        ...location,
        riskScore: parseFloat(riskScore.toFixed(1)),
        riskLevel: riskScore > 7 ? 'High' : riskScore > 4 ? 'Medium' : 'Low'
      }
    })

    return locationRiskArray.sort((a, b) => b.riskScore - a.riskScore)
  }

  // Calculate risk index based on USER'S LOCATION only
  const calculateRiskIndex = (reports, symptomCounts, areaKey) => {
    if (!areaKey) return 0
    
    const userLocationReports = reports.filter(report => getReportLocationClusterKey(report) === areaKey)
    if (userLocationReports.length === 0) return 0
    
    // Severe symptoms that increase risk
    const severeSymptoms = ['fever', 'shortness of breath', 'severe cough', 'chest pain']
    
    // Multi-factor risk formula
    // Risk_Index = (Report_Density × 0.3) + (Severe_Symptom_Score × 0.4) + (Symptom_Diversity × 0.3)
    
    // Report Density: normalized by 5 reports (0-3 points)
    const reportDensityScore = Math.min(userLocationReports.length / 5, 3)
    
    // Severe Symptom Score: count severe symptoms (0-4 points)
    let severeCounts = 0
    userLocationReports.forEach(report => {
      report.symptoms.forEach(symptom => {
        if (severeSymptoms.includes(symptom.toLowerCase())) {
          severeCounts += 1
        }
      })
    })
    const severeSymptomScore = Math.min(severeCounts / 3, 4)
    
    // Symptom Diversity: unique symptoms (0-2 points)
    const uniqueSymptoms = new Set()
    userLocationReports.forEach(report => {
      report.symptoms.forEach(symptom => uniqueSymptoms.add(symptom))
    })
    const diversityScore = Math.min(uniqueSymptoms.size / 10, 2)
    
    // Apply weighted formula (0-10 scale)
    const totalRisk = Math.min(
      (reportDensityScore * 0.3) + (severeSymptomScore * 0.4) + (diversityScore * 0.3),
      10
    )
    return parseFloat(totalRisk.toFixed(1))
  }

  // Calculate overall risk index (for reference)
  const calculateOverallRiskIndex = (reports, symptomCounts) => {
    if (!reports || reports.length === 0) return 0
    
    // Severe symptoms that increase risk
    const severeSymptoms = ['fever', 'shortness of breath', 'severe cough', 'chest pain']
    
    // Report Density: normalized by 10 reports baseline (0-3 points)
    const reportDensityScore = Math.min(reports.length / 10, 3)
    
    // Severe Symptom Score (0-4 points) - weighted by prevalence
    let severeSymptomScore = 0
    if (symptomCounts && symptomCounts.total) {
      const totalSymptomCount = Object.values(symptomCounts.total).reduce((a, b) => a + b, 0)
      severeSymptoms.forEach(symptom => {
        const count = symptomCounts.total[symptom] || 0
        severeSymptomScore += (count / Math.max(totalSymptomCount, 1)) * 4
      })
    }
    severeSymptomScore = Math.min(severeSymptomScore, 4)
    
    // Symptom Diversity: unique symptom types (0-2 points)
    const uniqueSymptoms = new Set()
    reports.forEach(report => {
      report.symptoms.forEach(symptom => uniqueSymptoms.add(symptom))
    })
    const diversityScore = Math.min(uniqueSymptoms.size / 10, 2)
    
    // Apply weighted formula: (Density × 0.3) + (Severe × 0.4) + (Diversity × 0.3)
    const totalRisk = Math.min(
      (reportDensityScore * 0.3) + (severeSymptomScore * 0.4) + (diversityScore * 0.3),
      10
    )
    return parseFloat(totalRisk.toFixed(1))
  }

  // Calculate heatmap data by best available location label
  const calculateHeatmapData = (reports) => {
    if (!reports || reports.length === 0) return []
    
    const locationStats = {}
    
    // Aggregate reports by location label
    reports.forEach(report => {
      const locationKey = getReportLocationClusterKey(report)
      if (!locationStats[locationKey]) {
        locationStats[locationKey] = {
          pincode: locationKey,
          count: 0,
          intensity: 0
        }
      }
      locationStats[locationKey].count += 1
    })
    
    // Convert to array and calculate intensity (0-1 scale)
    const maxCount = Math.max(...Object.values(locationStats).map(p => p.count), 1)
    const heatmapArray = Object.values(locationStats).map(item => ({
      ...item,
      intensity: item.count / maxCount
    }))
    
    return heatmapArray.sort((a, b) => b.count - a.count)
  }

  // Generate dynamic alerts based on report data
  const generateAlerts = (reports, symptomCounts, heatmapData, riskIndex, areaKey, areaLabel) => {
    const alerts = []
    
    const userAreaReports = reports.filter(report => getReportLocationClusterKey(report) === areaKey)
    if (userAreaReports.length >= 3) {
      alerts.push(`Rising cases in your area (${areaLabel}) - ${userAreaReports.length} recent reports`)
    }
    
    if (riskIndex > 7) {
      alerts.push(`High risk in your area (${areaLabel}) - Monitor closely`)
    } else if (riskIndex > 4) {
      alerts.push(`Medium risk in your area (${areaLabel}) - Stay vigilant`)
    }
    
    if (userAreaReports.length > 0) {
      const severeSymptoms = ['fever', 'shortness of breath', 'chest pain', 'severe cough']
      const hasSevere = userAreaReports.some(report => 
        report.symptoms.some(symptom => severeSymptoms.includes(symptom.toLowerCase()))
      )
      if (hasSevere) {
        alerts.push(`Severe symptoms reported in your area (${areaLabel})`)
      }
    }
    
    if (heatmapData && heatmapData.length > 0) {
      const highRiskAreas = heatmapData.filter(area => area.count >= 5)
      if (highRiskAreas.length > 0) {
        alerts.push(`${highRiskAreas.length} areas with high case concentrations detected`)
      }
    }
    
    return alerts.length > 0 ? alerts : ['No critical alerts in your area - System normal']
  }

  useEffect(() => {
    // Fetch recent reports from API
    const fetchReports = async () => {
      try {
        const response = await fetch(apiUrl('/api/reports?limit=10'))
        const data = await response.json()
        
        if (data && Array.isArray(data)) {
          // Transform API data to match UI format
          const formattedReports = data.map((report, idx) => ({
            id: report.id,
            symptoms: report.symptoms.join(', '),
            location: getReportLocationLabel(report),
            time: formatTimeAgo(new Date(report.created_at))
          }))
          
          // Calculate heatmap data from raw data
          const heatmapData = calculateHeatmapData(data)
          
          setRawReports(data)
          setReports(formattedReports)
          
          setStats(prev => ({
            ...prev,
            totalReports: data.length,
            heatmapData: heatmapData
          }))
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
      } finally {
        setLoading(false)
      }
    }

    // Fetch symptom counts from API
    const fetchSymptomCounts = async () => {
      try {
        // Also fetch all reports to get better heatmap data
        const reportsResponse = await fetch(apiUrl('/api/reports?limit=100'))
        const allReports = await reportsResponse.json()
        
        const response = await fetch(apiUrl('/api/symptom_counts'))
        const data = await response.json()
        
        if (data.total) {
          // Get top 5 symptoms
          const sorted = Object.entries(data.total)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([symptom]) => symptom.charAt(0).toUpperCase() + symptom.slice(1))
          
          // Prepare chart data (top 10 symptoms)
          const chartData = Object.entries(data.total)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([symptom, count]) => ({
              name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
              count: count
            }))
          setSymptomChartData(chartData)
          
          // Count total unique symptoms
          const uniqueSymptomCount = Object.keys(data.total).length
          
          // Calculate risk index for USER'S AREA (or overall if location not available yet)
          let riskScore = 0
          if (userAreaKey) {
            riskScore = calculateRiskIndex(allReports, data, userAreaKey)
          } else {
            riskScore = calculateOverallRiskIndex(allReports, data)
          }
          
          // Calculate location-based risks
          const locRisks = calculateLocationRisks(allReports, data)
          setLocationRisks(locRisks)
          
          // Calculate heatmap with all available reports
          const allHeatmapData = calculateHeatmapData(allReports)
          
          // Generate dynamic alerts
          const dynamicAlerts = generateAlerts(allReports, data, allHeatmapData, riskScore, userAreaKey, userAreaLabel)
          
          setStats(prev => ({
            ...prev,
            topSymptoms: sorted,
            riskIndex: riskScore,
            totalSymptoms: uniqueSymptomCount,
            heatmapData: allHeatmapData,
            recentAlerts: dynamicAlerts
          }))
        }
      } catch (err) {
        console.error('Error fetching symptom counts:', err)
      }
    }

    fetchReports()
    fetchSymptomCounts()

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchReports()
      fetchSymptomCounts()
    }, 30000)

    return () => clearInterval(interval)
  }, [userAreaKey, userAreaLabel])

  const formatTimeAgo = (date) => {
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="home-page fade-in">
      <div className="container">
        {/* Hero Section */}
        <section className="hero-section slide-up">
          <div className="hero-content">
            <h1>AI-Powered Disease Radar</h1>
            <p>Doctor-moderated health intelligence. Monitor approved disease clusters, track verified symptom trends, and enable faster response.</p>
            <div className="hero-buttons">
              <Link to="/report" className="btn btn-primary btn-lg btn-glow" style={{ textDecoration: 'none' }}>
                Submit Report
              </Link>
              <Link to="/map" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
                View Map
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <h2>Dashboard Metrics</h2>
          <div className="stats-grid">
            <button 
              className="stat-card-button"
              onClick={() => setSelectedMetric('reports')}
            >
              <Card glow hover>
                <div className="stat-card clickable">
                  <div className="stat-number">{stats.totalReports}</div>
                  <div className="stat-label">Total Reports</div>
                  <div className="stat-trend">Real-time data</div>
                  <div className="click-hint">Click for details</div>
                </div>
              </Card>
            </button>
            <button 
              className="stat-card-button"
              onClick={() => setSelectedMetric('symptoms')}
            >
              <Card glow hover>
                <div className="stat-card clickable">
                  <div className="stat-number">{stats.totalSymptoms}</div>
                  <div className="stat-label">Tracked Symptoms</div>
                  <div className="stat-trend">Active monitoring</div>
                  <div className="click-hint">Click for details</div>
                </div>
              </Card>
            </button>
            <button 
              className="stat-card-button"
              onClick={() => setSelectedMetric('risk')}
            >
              <Card glow hover>
                <div className="stat-card clickable">
                  <div className="stat-number">{stats.riskIndex.toFixed(1)}</div>
                  <div className="stat-label">Risk Index</div>
                  <div className="stat-trend">{stats.riskIndex > 7 ? 'High Risk' : stats.riskIndex > 4 ? 'Medium Risk' : 'Low Risk'}</div>
                  <div className="click-hint">Click for location breakdown</div>
                </div>
              </Card>
            </button>
            <button 
              className="stat-card-button"
              onClick={() => setSelectedMetric('areas')}
            >
              <Card glow hover>
                <div className="stat-card clickable">
                  <div className="stat-number">{stats.heatmapData.length || 0}</div>
                  <div className="stat-label">Affected Areas</div>
                  <div className="stat-trend">Geographic distribution</div>
                  <div className="click-hint">Click for details</div>
                </div>
              </Card>
            </button>
          </div>
        </section>

        {/* Charts Preview */}
        <section className="charts-section">
          <h2>Symptom Analysis</h2>
          <div className="charts-grid">
            {symptomChartData.length > 0 ? (
              <SymptomBarChart 
                data={symptomChartData}
                title="Top 10 Symptoms by Frequency"
              />
            ) : (
              <Card hover>
                <div className="chart-placeholder">
                  <div className="chart-title">Top Symptoms</div>
                  <div className="loading-message">Loading chart data...</div>
                </div>
              </Card>
            )}

            <Card hover>
              <div className="chart-placeholder">
                <div className="chart-title">Geographic Heatmap</div>
                <div className="heatmap-preview">
                  <div className="heatmap-grid">
                    {stats.heatmapData.length > 0 ? (
                      stats.heatmapData.slice(0, 6).map((location, idx) => {
                        // Better color coding: only show red if > 5 reports, orange for 3-5, blue for 1-2
                        let intensityLevel = 'cool'
                        if (location.count >= 5) {
                          intensityLevel = 'hot'
                        } else if (location.count >= 3) {
                          intensityLevel = 'warm'
                        }
                        return (
                          <div key={idx} className={`heatmap-cell ${intensityLevel}`} title={`${location.pincode}: ${location.count} report${location.count > 1 ? 's' : ''}`}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{location.pincode}</div>
                            <div style={{ fontSize: '12px' }}>({location.count})</div>
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ width: '100%', textAlign: 'center', color: '#8a9ab0', gridColumn: '1 / -1' }}>No geographic data</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Recent Reports */}
        <section className="reports-section">
          <h2>Recent Verified Cases</h2>
          <Card>
            <div className="reports-table">
              <div className="table-header">
                <div className="col-time">Time</div>
                <div className="col-symptoms">Symptoms</div>
                <div className="col-location">Location</div>
              </div>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#8a9ab0' }}>Loading reports...</div>
              ) : reports.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#8a9ab0' }}>No reports yet. <Link to="/report">Submit one!</Link></div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="table-row">
                    <div className="col-time">{report.time}</div>
                    <div className="col-symptoms">{report.symptoms}</div>
                    <div className="col-location">
                      <span className="location-badge">{report.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        {/* Alerts */}
        <section className="alerts-section">
          <h2>Active Alerts</h2>
          <div className="alerts-grid">
            {stats.recentAlerts.map((alert, idx) => (
              <Card key={idx} glow>
                <div className="alert-card">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <div className="alert-title">Alert</div>
                    <div className="alert-message">{alert}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Metric Detail Modal */}
        {selectedMetric && (
          <div className="modal-overlay" onClick={() => setSelectedMetric(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedMetric(null)}>✕</button>
              
              {selectedMetric === 'reports' && (
                <div className="modal-body">
                  <h2>Total Reports Overview</h2>
                  <div className="modal-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Reports:</span>
                      <span className="stat-value">{stats.totalReports}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Recent Reports:</span>
                      <span className="stat-value">{reports.length}</span>
                    </div>
                  </div>
                  <div className="report-list">
                    {reports.slice(0, 10).map((report, idx) => (
                      <div key={idx} className="report-item">
                        <div className="report-meta">
                          <span className="report-time">{report.time}</span>
                          <span className="report-location">{report.location}</span>
                        </div>
                        <div className="report-symptoms">{report.symptoms}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMetric === 'symptoms' && (
                <div className="modal-body">
                  <h2>Symptom Tracking</h2>
                  <div className="symptom-list">
                    <div className="stat-item">
                      <span className="stat-label">Total Unique Symptoms:</span>
                      <span className="stat-value">{stats.totalSymptoms}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Top Symptoms:</span>
                    </div>
                    <div className="symptoms-tags">
                      {stats.topSymptoms.map((symptom, idx) => (
                        <span key={idx} className="symptom-tag">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'risk' && (
                <div className="modal-body">
                  <h2>Location-Based Risk Analysis</h2>
                  {userAreaLabel && (
                    <div className="user-location-highlight">
                      Your area: <strong>{userAreaLabel}</strong>
                    </div>
                  )}
                  <div className="risk-summary">
                    <div className="stat-item">
                      <span className="stat-label">Risk in Your Area:</span>
                      <span className="stat-value">{stats.riskIndex.toFixed(1)}/10</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Risk Level:</span>
                      <span className={`risk-badge risk-${stats.riskIndex > 7 ? 'high' : stats.riskIndex > 4 ? 'medium' : 'low'}`}>
                        {stats.riskIndex > 7 ? 'HIGH RISK' : stats.riskIndex > 4 ? 'MEDIUM RISK' : 'LOW RISK'}
                      </span>
                    </div>
                  </div>
                  <h3>Risk by Area</h3>
                  <div className="location-risk-table">
                    <div className="table-header">
                      <div className="col-pincode">Area</div>
                      <div className="col-reports">Reports</div>
                      <div className="col-risk">Risk Score</div>
                      <div className="col-level">Level</div>
                    </div>
                    {locationRisks.slice(0, 10).map((location, idx) => (
                      <div 
                        key={idx} 
                        className={`table-row ${location.pincode === userAreaKey ? 'user-location-row' : ''}`}
                      >
                        <div className="col-pincode">
                          {location.pincode === userAreaKey && 'You '}
                          {location.pincode}
                        </div>
                        <div className="col-reports">{location.reportCount}</div>
                        <div className="col-risk">{location.riskScore.toFixed(1)}</div>
                        <div className={`col-level risk-${location.riskLevel.toLowerCase()}`}>
                          {location.riskLevel}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMetric === 'areas' && (
                <div className="modal-body">
                  <h2>Affected Areas</h2>
                  <div className="stat-item">
                    <span className="stat-label">Total Affected Areas:</span>
                    <span className="stat-value">{stats.heatmapData.length}</span>
                  </div>
                  <h3>Report Distribution by Area</h3>
                  <div className="areas-table">
                    <div className="table-header">
                      <div className="col-pincode">Area</div>
                      <div className="col-count">Reports</div>
                      <div className="col-intensity">Intensity</div>
                    </div>
                    {stats.heatmapData.map((area, idx) => (
                      <div key={idx} className="table-row">
                        <div className="col-pincode">{area.pincode}</div>
                        <div className="col-count">{area.count}</div>
                        <div className="col-intensity">
                          <div className="intensity-bar">
                            <div className="intensity-fill" style={{ width: `${area.intensity * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react';
import SymptomBarChart from '../ui/SymptomBarChart';
import SymptomTrendChart from '../ui/SymptomTrendChart';
import SymptomPieChart from '../ui/SymptomPieChart';
import LocationRiskChart from '../ui/LocationRiskChart';
import Card from '../ui/Card';
import { apiUrl } from '../config';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const [symptomData, setSymptomData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [locationRisks, setLocationRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    uniqueSymptoms: 0,
    topSymptom: 'N/A',
  });

  useEffect(() => {
    // Initial fetch
    fetchAnalyticsData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports
      const reportsRes = await fetch(apiUrl('/api/reports'));
      const reports = await reportsRes.json();

      // Fetch symptom counts
      const symptomRes = await fetch(apiUrl('/api/symptom_counts'));
      const symptomCounts = await symptomRes.json();

      // Process symptom data for bar chart
      const barChartData = Object.entries(symptomCounts.total || {})
        .map(([symptom, count]) => ({
          name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
          count: count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Top 15 symptoms

      setSymptomData(barChartData);
      setPieData(barChartData.slice(0, 10)); // Top 10 for pie chart

      // Calculate trend data (by date)
      const dateCounts = {};
      reports.forEach(report => {
        const date = report.onset_date || report.created_at?.split('T')[0];
        if (date) {
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
      });

      const trendChartData = Object.entries(dateCounts)
        .map(([date, count]) => ({
          date,
          count,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setTrendData(trendChartData);

      // Calculate location risks
      const locationStats = {};
      reports.forEach(report => {
        const pincode = report.pincode || 'Unknown';
        if (!locationStats[pincode]) {
          locationStats[pincode] = {
            pincode,
            reportCount: 0,
            symptoms: {},
          };
        }
        locationStats[pincode].reportCount += 1;
        report.symptoms.forEach(symptom => {
          const lower = symptom.toLowerCase();
          locationStats[pincode].symptoms[lower] = (locationStats[pincode].symptoms[lower] || 0) + 1;
        });
      });

      // Calculate location risks with multi-factor formula
      const severeSymptoms = ['fever', 'shortness of breath', 'severe cough', 'chest pain'];
      const locationRiskData = Object.values(locationStats)
        .map(location => {
          // Multi-factor risk formula
          const reportDensity = Math.min(location.reportCount / 5, 3);
          const severeCount = severeSymptoms.reduce((sum, sym) => sum + (location.symptoms[sym] || 0), 0);
          const severeScore = Math.min(severeCount / 3, 4);
          const uniqueSymptoms = Object.keys(location.symptoms).length;
          const symptomDiversity = Math.min(uniqueSymptoms / 10, 2);
          
          // Risk Index = (Report_Density × 0.3) + (Severe_Symptom_Score × 0.4) + (Symptom_Diversity × 0.3)
          const riskIndex = Math.min(
            (reportDensity * 0.3) + (severeScore * 0.4) + (symptomDiversity * 0.3),
            10
          );
          
          return {
            pincode: location.pincode,
            reportCount: location.reportCount,
            riskIndex: parseFloat(riskIndex.toFixed(2)),
          };
        })
        .sort((a, b) => b.riskIndex - a.riskIndex);

      setLocationRisks(locationRiskData);

      // Calculate stats
      const uniqueSymptoms = Object.keys(symptomCounts.total || {}).length;
      const topSymptom = barChartData.length > 0 ? barChartData[0].name : 'N/A';

      setStats({
        totalReports: reports.length,
        uniqueSymptoms,
        topSymptom,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page fade-in">
        <h1>Analytics Dashboard</h1>
        <div className="chart-loading">
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page fade-in">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Research and analysis built from doctor-approved cases only</p>
      </div>

      {/* Key Statistics */}
      <div className="stats-grid">
        <Card glow className="stat-card">
          <div className="stat-number">{stats.totalReports}</div>
          <div className="stat-label">Verified Cases</div>
          <div className="stat-desc">Doctor-approved reports</div>
        </Card>
        <Card glow className="stat-card">
          <div className="stat-number">{stats.uniqueSymptoms}</div>
          <div className="stat-label">Unique Symptoms</div>
          <div className="stat-desc">Tracked symptoms</div>
        </Card>
        <Card glow className="stat-card">
          <div className="stat-number">{stats.topSymptom}</div>
          <div className="stat-label">Most Common</div>
          <div className="stat-desc">Top symptom</div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h2>Symptom Analysis</h2>
        
        <div className="charts-grid">
          <SymptomBarChart 
            data={symptomData}
            title="Top Symptoms by Frequency"
          />
          
          <SymptomPieChart 
            data={pieData}
            title="Top 10 Symptoms Distribution"
          />
        </div>

        <div className="charts-grid charts-grid-full">
          <SymptomTrendChart 
            data={trendData}
            title="Verified Case Trends Over Time"
          />
        </div>

        <div className="charts-grid charts-grid-full">
          <LocationRiskChart 
            data={locationRisks}
            title="Risk Index by Location (Pincode)"
          />
        </div>
      </div>

      {/* Data Export Section */}
      <div className="export-section">
        <Card glow>
          <h3>Export Data</h3>
          <p>Download analytics built from approved cases for further research and external tools</p>
          <div className="export-buttons">
            <button className="export-btn csv-btn" onClick={() => exportAsCSV(symptomData, trendData, locationRisks, stats)}>
              📊 Export as CSV
            </button>
            <button className="export-btn json-btn" onClick={() => exportAsJSON(symptomData, trendData, locationRisks, stats)}>
              📄 Export as JSON
            </button>
          </div>
        </Card>
      </div>

      {/* Methodology Section */}
      <div className="methodology-section">
        <Card glow>
          <h3>Analysis Methodology</h3>
          <div className="methodology-content">
            <div className="method-item">
              <h4>Symptom Frequency Analysis</h4>
              <p>Counts symptoms across approved cases to identify the most prevalent health concerns.</p>
            </div>
            <div className="method-item">
              <h4>Temporal Trend Analysis</h4>
              <p>Tracks approved cases over time to identify emerging patterns and outbreaks.</p>
            </div>
            <div className="method-item">
              <h4>Geographic Risk Assessment</h4>
              <p>Calculates risk indices based on severe symptom prevalence in different locations (pincodes).</p>
            </div>
            <div className="method-item">
              <h4>Distribution Analysis</h4>
              <p>Visualizes the proportion of symptoms to understand disease patterns and comorbidities.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper function to export data as CSV
function exportAsCSV(symptomData, trendData, locationRisks, stats) {
  try {
    let csvContent = 'Disease Radar Analytics Export\n';
    csvContent += 'Exported: ' + new Date().toLocaleString() + '\n\n';
    
    // Summary Statistics
    csvContent += 'SUMMARY STATISTICS\n';
    csvContent += 'Total Reports,' + stats.totalReports + '\n';
    csvContent += 'Unique Symptoms,' + stats.uniqueSymptoms + '\n';
    csvContent += 'Top Symptom,' + stats.topSymptom + '\n\n';
    
    // Symptom Frequency Data
    csvContent += 'SYMPTOM FREQUENCY\n';
    csvContent += 'Symptom,Count\n';
    symptomData.forEach(item => {
      csvContent += '"' + item.name + '",' + item.count + '\n';
    });
    csvContent += '\n';
    
    // Trend Data
    csvContent += 'REPORT TRENDS OVER TIME\n';
    csvContent += 'Date,Count\n';
    trendData.forEach(item => {
      csvContent += item.date + ',' + item.count + '\n';
    });
    csvContent += '\n';
    
    // Location Risk Data
    csvContent += 'GEOGRAPHIC RISK ASSESSMENT\n';
    csvContent += 'Location (Pincode),Report Count,Risk Index\n';
    locationRisks.forEach(item => {
      csvContent += item.pincode + ',' + item.reportCount + ',' + item.riskIndex + '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'disease-radar-analytics-' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Error exporting CSV: ' + error.message);
  }
}

// Helper function to export data as JSON
function exportAsJSON(symptomData, trendData, locationRisks, stats) {
  try {
    const exportData = {
      exportDate: new Date().toLocaleString(),
      summary: {
        totalReports: stats.totalReports,
        uniqueSymptoms: stats.uniqueSymptoms,
        topSymptom: stats.topSymptom,
      },
      symptomFrequency: symptomData,
      reportTrends: trendData,
      geographicRisk: locationRisks,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'disease-radar-analytics-' + new Date().toISOString().slice(0, 10) + '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    alert('Error exporting JSON: ' + error.message);
  }
}

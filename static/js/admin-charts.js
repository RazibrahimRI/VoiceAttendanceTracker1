// Admin Charts JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load chart data and initialize charts
    loadChartData();
});

async function loadChartData() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading chart data:', data.error);
            return;
        }
        
        initializeAttendanceChart(data.attendance_stats);
        initializeTaskChart(data.task_stats);
    } catch (error) {
        console.error('Failed to load chart data:', error);
    }
}

function initializeAttendanceChart(attendanceData) {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    const labels = attendanceData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = attendanceData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Attendance',
                data: data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0d6efd',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `Date: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `Attendance: ${context.parsed.y} users`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    ticks: {
                        color: '#6c757d',
                        stepSize: 1
                    }
                }
            },
            elements: {
                point: {
                    hoverBorderWidth: 3
                }
            }
        }
    });
}

function initializeTaskChart(taskData) {
    const ctx = document.getElementById('taskChart');
    if (!ctx) return;
    
    const labels = ['Pending', 'In Progress', 'Completed'];
    const data = [
        taskData.pending || 0,
        taskData.in_progress || 0,
        taskData.completed || 0
    ];
    
    const colors = [
        '#6c757d', // Pending - Gray
        '#ffc107', // In Progress - Warning/Yellow
        '#198754'  // Completed - Success/Green
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#6c757d',
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            elements: {
                arc: {
                    borderWidth: 2
                }
            }
        }
    });
}

// Add real-time updates (optional)
function startRealTimeUpdates() {
    // Update charts every 5 minutes
    setInterval(() => {
        loadChartData();
    }, 300000);
}

// Additional utility functions for admin dashboard
function exportAttendanceData() {
    // Implementation for exporting attendance data to CSV
    fetch('/api/admin/export/attendance')
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'attendance_report.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Export failed:', error));
}

function refreshDashboard() {
    // Refresh all dashboard data
    loadChartData();
    
    // Show refresh indicator
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }, 2000);
    }
}

// Initialize real-time updates if needed
// startRealTimeUpdates();

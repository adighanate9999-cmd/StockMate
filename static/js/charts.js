/**
 * SMART STOCK & MONEY MANAGER - Interactive Chart.js Initializers
 */

// Global Chart defaults
if (window.Chart) {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
    Chart.defaults.borderColor = '#f1f5f9';
}

/**
 * Initialize Dashboard Daily Sales & Profit Trend Chart
 */
function initDashboardTrendChart(canvasId, dailyTrendData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || !dailyTrendData || dailyTrendData.length === 0) return;

    const labels = dailyTrendData.map(d => d.label);
    const salesData = dailyTrendData.map(d => d.sales);
    const profitData = dailyTrendData.map(d => d.profit);

    // Create Gradients
    const salesGrad = ctx.createLinearGradient(0, 0, 0, 300);
    salesGrad.addColorStop(0, 'rgba(30, 58, 138, 0.25)');
    salesGrad.addColorStop(1, 'rgba(30, 58, 138, 0.01)');

    const profitGrad = ctx.createLinearGradient(0, 0, 0, 300);
    profitGrad.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    profitGrad.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sales Revenue',
                    data: salesData,
                    borderColor: '#1e3a8a',
                    backgroundColor: salesGrad,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#1e3a8a',
                    pointHoverRadius: 6
                },
                {
                    label: 'Gross Profit',
                    data: profitData,
                    borderColor: '#10b981',
                    backgroundColor: profitGrad,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#10b981',
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 12, weight: 600 }
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ₹${Number(context.raw).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    border: { dash: [4, 4] },
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        callback: function(val) {
                            return '₹' + Number(val).toLocaleString('en-IN');
                        },
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Category Distribution Doughnut Chart
 */
function initCategoryDonutChart(canvasId, categoryData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || !categoryData || categoryData.length === 0) return;

    const labels = categoryData.map(c => c.category_name);
    const dataVals = categoryData.map(c => c.total_sales);

    const colors = [
        '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', 
        '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataVals,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        font: { size: 11, weight: 500 },
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ₹${Number(context.raw).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                        }
                    }
                }
            }
        }
    });
}

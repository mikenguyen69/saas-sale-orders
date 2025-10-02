'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function OrderValueTrendsChart() {
  const hardcodedData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Current FY 2024',
        data: [
          125000, 142000, 138000, 156000, 168000, 182000, 195000, 178000, 186000, 201000, 215000,
          234000,
        ],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Previous FY 2023',
        data: [
          98000, 105000, 112000, 118000, 125000, 134000, 128000, 142000, 138000, 155000, 162000,
          178000,
        ],
        borderColor: '#ed6c02',
        backgroundColor: 'rgba(237, 108, 2, 0.1)',
        tension: 0.4,
        fill: false,
        borderDash: [5, 5],
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Order Value ($)',
        },
        ticks: {
          callback: function (value: any) {
            return '$' + value.toLocaleString()
          },
        },
      },
      x: {
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  }

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={hardcodedData} options={options} />
    </div>
  )
}

'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function OrdersPerRetailerChart() {
  const hardcodedData = {
    labels: [
      'Countdown',
      'New World',
      'Pak n Save',
      'FreshChoice',
      'SuperValue',
      'Village Store',
      'Local Mart',
      'Corner Shop',
      'Market Fresh',
      'Quick Stop',
    ],
    datasets: [
      {
        label: 'Total Orders (Current FY)',
        data: [245, 198, 156, 134, 112, 45, 38, 32, 28, 15],
        backgroundColor: [
          '#1976d2',
          '#2e7d32',
          '#ed6c02',
          '#9c27b0',
          '#d32f2f',
          '#0288d1',
          '#388e3c',
          '#f57c00',
          '#7b1fa2',
          '#c62828',
        ],
        borderColor: [
          '#0d47a1',
          '#1b5e20',
          '#e65100',
          '#4a148c',
          '#b71c1c',
          '#01579b',
          '#1b5e20',
          '#ef6c00',
          '#4a148c',
          '#b71c1c',
        ],
        borderWidth: 1,
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
            return `${context.parsed.y} orders`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Orders',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Retailers',
        },
      },
    },
  }

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Bar data={hardcodedData} options={options} />
    </div>
  )
}

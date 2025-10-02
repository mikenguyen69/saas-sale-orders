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

export function ConversionValueRatioChart() {
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
        label: 'Value per Visit ($)',
        data: [285, 312, 267, 245, 198, 156, 134, 118, 95, 78],
        backgroundColor: [
          '#2e7d32',
          '#388e3c',
          '#43a047',
          '#4caf50',
          '#66bb6a',
          '#81c784',
          '#a5d6a7',
          '#c8e6c9',
          '#dcedc8',
          '#f1f8e9',
        ],
        borderColor: '#1b5e20',
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
            return `$${context.parsed.y} per visit`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value per Visit ($)',
        },
        ticks: {
          callback: function (value: any) {
            return '$' + value
          },
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

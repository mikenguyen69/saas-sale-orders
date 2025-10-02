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

export function OrderValuePerSalespersonChart() {
  const hardcodedData = {
    labels: [
      'Sarah Chen',
      'Mike Johnson',
      'Emily Watson',
      'David Kim',
      'Jessica Taylor',
      'Alex Rodriguez',
    ],
    datasets: [
      {
        label: 'Total Order Value (Past 12 Months)',
        data: [845000, 762000, 698000, 634000, 578000, 512000],
        backgroundColor: ['#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688'],
        borderColor: ['#7b1fa2', '#512da8', '#303f9f', '#1976d2', '#0097a7', '#00695c'],
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
            return `$${context.parsed.y.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Order Value ($)',
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
          text: 'Salespeople',
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

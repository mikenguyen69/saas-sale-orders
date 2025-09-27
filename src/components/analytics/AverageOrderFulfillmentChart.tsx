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

export function AverageOrderFulfillmentChart() {
  const hardcodedData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Average Fulfillment Time (Days)',
        data: [7.2, 6.8, 7.5, 6.9, 6.3, 5.8, 6.1, 5.9, 5.5, 5.2, 4.8, 4.5],
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#d32f2f',
        pointBorderColor: '#b71c1c',
        pointRadius: 5,
        pointHoverRadius: 7,
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
            return `${context.parsed.y} days average`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Days to Complete',
        },
        ticks: {
          callback: function (value: any) {
            return value + ' days'
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

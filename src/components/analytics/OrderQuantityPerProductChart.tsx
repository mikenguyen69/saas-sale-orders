'use client'

import { useState } from 'react'
import { Box, IconButton } from '@mui/material'
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material'
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

export function OrderQuantityPerProductChart() {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10

  const allProducts = [
    {
      name: 'Vitamin D3 1000IU',
      monthlyData: [245, 198, 234, 267, 289, 312, 298, 276, 254, 298, 321, 345],
    },
    {
      name: 'Omega-3 Fish Oil',
      monthlyData: [189, 156, 167, 198, 234, 256, 243, 221, 198, 267, 289, 312],
    },
    {
      name: 'Multivitamin Complex',
      monthlyData: [234, 267, 289, 312, 298, 276, 254, 298, 321, 345, 367, 389],
    },
    {
      name: 'Vitamin C 1000mg',
      monthlyData: [156, 134, 145, 167, 189, 198, 187, 165, 143, 189, 212, 234],
    },
    {
      name: 'Magnesium Glycinate',
      monthlyData: [112, 98, 109, 123, 134, 145, 139, 127, 115, 134, 156, 167],
    },
    {
      name: 'Probiotics Daily',
      monthlyData: [98, 87, 95, 108, 119, 128, 124, 112, 101, 119, 134, 145],
    },
    {
      name: 'Iron Bisglycinate',
      monthlyData: [87, 76, 83, 95, 104, 112, 108, 97, 86, 104, 119, 128],
    },
    {
      name: 'Calcium + D3',
      monthlyData: [134, 119, 128, 145, 156, 167, 161, 149, 137, 156, 175, 189],
    },
    { name: 'Zinc Picolinate', monthlyData: [76, 67, 74, 83, 91, 98, 94, 84, 75, 91, 104, 112] },
    {
      name: 'B-Complex High Potency',
      monthlyData: [119, 108, 115, 128, 139, 148, 143, 131, 120, 139, 156, 167],
    },
    { name: 'CoQ10 100mg', monthlyData: [67, 58, 65, 74, 81, 87, 83, 75, 68, 81, 91, 98] },
    {
      name: 'Turmeric Curcumin',
      monthlyData: [108, 97, 104, 119, 128, 137, 132, 120, 109, 128, 145, 156],
    },
    { name: 'Ashwagandha Extract', monthlyData: [58, 52, 57, 65, 71, 76, 73, 67, 61, 71, 81, 87] },
    {
      name: 'Melatonin 3mg',
      monthlyData: [97, 86, 93, 108, 117, 126, 121, 109, 98, 117, 132, 145],
    },
    { name: 'Green Tea Extract', monthlyData: [52, 46, 51, 58, 64, 69, 66, 60, 54, 64, 73, 79] },
  ]

  const totalPages = Math.ceil(allProducts.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const currentProducts = allProducts.slice(startIndex, startIndex + itemsPerPage)

  const monthlyColors = [
    '#1976d2',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff5722',
  ]

  const hardcodedData = {
    labels: currentProducts.map(product => product.name),
    datasets: [
      {
        label: 'Total Quantity (12 Months)',
        data: currentProducts.map(product =>
          product.monthlyData.reduce((sum, val) => sum + val, 0)
        ),
        backgroundColor: currentProducts.map((_, index) => {
          const colorIndex = (startIndex + index) % monthlyColors.length
          return monthlyColors[colorIndex] + '80'
        }),
        borderColor: currentProducts.map((_, index) => {
          const colorIndex = (startIndex + index) % monthlyColors.length
          return monthlyColors[colorIndex]
        }),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const productIndex = startIndex + context.dataIndex
            const product = allProducts[productIndex]
            const monthNames = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ]
            let breakdown = 'Monthly breakdown:\n'
            product.monthlyData.forEach((value, index) => {
              breakdown += `${monthNames[index]}: ${value}\n`
            })
            return [`Total: ${context.parsed.x} units`, breakdown]
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity Ordered',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Products',
        },
      },
    },
  }

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box fontSize="0.875rem" color="text.secondary">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, allProducts.length)} of{' '}
          {allProducts.length} products
        </Box>
        <Box>
          <IconButton onClick={handlePrevious} disabled={currentPage === 0} size="small">
            <KeyboardArrowUp />
          </IconButton>
          <IconButton onClick={handleNext} disabled={currentPage === totalPages - 1} size="small">
            <KeyboardArrowDown />
          </IconButton>
        </Box>
      </Box>
      <div style={{ height: '400px', width: '100%' }}>
        <Bar data={hardcodedData} options={options} />
      </div>
    </Box>
  )
}

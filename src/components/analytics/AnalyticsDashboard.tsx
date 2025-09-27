'use client'

import { Grid, Typography, Card, CardContent } from '@mui/material'
import { OrdersPerRetailerChart } from './OrdersPerRetailerChart'
import { OrderValueTrendsChart } from './OrderValueTrendsChart'
import { ConversionValueRatioChart } from './ConversionValueRatioChart'
import { OrderValuePerSalespersonChart } from './OrderValuePerSalespersonChart'
import { AverageOrderFulfillmentChart } from './AverageOrderFulfillmentChart'
import { OrderQuantityPerProductChart } from './OrderQuantityPerProductChart'

export function AnalyticsDashboard() {
  return (
    <>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Analytics Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Orders per Retailer
              </Typography>
              <OrdersPerRetailerChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Value Trends
              </Typography>
              <OrderValueTrendsChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Value Ratio
              </Typography>
              <ConversionValueRatioChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Value per Salesperson
              </Typography>
              <OrderValuePerSalespersonChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Order Fulfillment Time
              </Typography>
              <AverageOrderFulfillmentChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Quantity per Product
              </Typography>
              <OrderQuantityPerProductChart />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

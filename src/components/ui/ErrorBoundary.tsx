'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Container, Alert } from '@mui/material'
import { Refresh } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container maxWidth="md">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="50vh"
            textAlign="center"
            gap={3}
          >
            <Alert severity="error" sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary">
                An unexpected error occurred. Please try refreshing the page.
              </Typography>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, width: '100%' }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReset}
              size="large"
            >
              Try Again
            </Button>
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}

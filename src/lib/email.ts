import sgMail from '@sendgrid/mail'

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
} else {
  console.warn('SENDGRID_API_KEY is not configured')
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailService {
  private readonly defaultFrom: string

  constructor() {
    this.defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'noreply@saas-sale-orders.com'
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate required environment variables
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable is required')
      }

      // Validate required options
      if (!options.to) {
        throw new Error('Email recipient (to) is required')
      }

      if (!options.subject) {
        throw new Error('Email subject is required')
      }

      if (!options.html && !options.text) {
        throw new Error('Email must have either HTML or text content')
      }

      const emailData: sgMail.MailDataRequired = {
        to: options.to,
        from: options.from || this.defaultFrom,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      }

      console.log(
        `[EmailService] Sending email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
      )
      console.log(`[EmailService] Subject: ${options.subject}`)

      const [response] = await sgMail.send(emailData)

      console.log(`[EmailService] Email sent successfully. Status: ${response.statusCode}`)

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
      }
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error)

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async sendTestEmail(to: string): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: 'Test Email from SaaS Sale Orders',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the SaaS Sale Orders email service.</p>
        <p>If you received this email, the email service is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `Test Email - This is a test email from the SaaS Sale Orders email service. Timestamp: ${new Date().toISOString()}`,
    })
  }

  async validateConfiguration(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!process.env.SENDGRID_API_KEY) {
      errors.push('SENDGRID_API_KEY environment variable is missing')
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      errors.push('SENDGRID_FROM_EMAIL environment variable is missing (using default)')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Create singleton instance
export const emailService = new EmailService()

// Export for testing
export { sgMail }

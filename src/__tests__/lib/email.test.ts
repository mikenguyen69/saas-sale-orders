import { EmailService, emailService, sgMail } from '@/lib/email'
import type { ClientResponse } from '@sendgrid/mail'

// Mock SendGrid
jest.mock('@sendgrid/mail')
const mockSgMail = sgMail as jest.Mocked<typeof sgMail>

describe('EmailService', () => {
  let service: EmailService

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset environment variables before creating service
    process.env.SENDGRID_API_KEY = 'test-api-key'
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com'

    service = new EmailService()
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SENDGRID_API_KEY
    delete process.env.SENDGRID_FROM_EMAIL
  })

  describe('constructor', () => {
    it('should initialize with default from email when env var is not set', () => {
      delete process.env.SENDGRID_FROM_EMAIL
      const testService = new EmailService()
      expect(testService).toBeInstanceOf(EmailService)
    })

    it('should use SENDGRID_FROM_EMAIL when available', () => {
      process.env.SENDGRID_FROM_EMAIL = 'custom@example.com'
      const testService = new EmailService()
      expect(testService).toBeInstanceOf(EmailService)
    })
  })

  describe('sendEmail', () => {
    const mockEmailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML content</p>',
      text: 'Test text content',
    }

    const mockResponse = {
      statusCode: 202,
      headers: {
        'x-message-id': 'test-message-id-123',
      },
    }

    beforeEach(() => {
      mockSgMail.send.mockResolvedValue([mockResponse as ClientResponse, {}])
    })

    it('should send email successfully', async () => {
      const result = await service.sendEmail(mockEmailOptions)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-message-id-123')
      expect(result.error).toBeUndefined()

      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        from: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      })
    })

    it('should use custom from address when provided', async () => {
      const options = {
        ...mockEmailOptions,
        from: 'custom@sender.com',
      }

      await service.sendEmail(options)

      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@sender.com',
        })
      )
    })

    it('should handle multiple recipients', async () => {
      const options = {
        ...mockEmailOptions,
        to: ['recipient1@example.com', 'recipient2@example.com'],
      }

      await service.sendEmail(options)

      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        })
      )
    })

    it('should handle CC and BCC recipients', async () => {
      const options = {
        ...mockEmailOptions,
        cc: 'cc@example.com',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      }

      await service.sendEmail(options)

      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: ['bcc1@example.com', 'bcc2@example.com'],
        })
      )
    })

    it('should handle attachments', async () => {
      const options = {
        ...mockEmailOptions,
        attachments: [
          {
            content: 'base64-content',
            filename: 'test.pdf',
            type: 'application/pdf',
          },
        ],
      }

      await service.sendEmail(options)

      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              content: 'base64-content',
              filename: 'test.pdf',
              type: 'application/pdf',
            },
          ],
        })
      )
    })

    it('should return error when SENDGRID_API_KEY is missing', async () => {
      delete process.env.SENDGRID_API_KEY

      const result = await service.sendEmail(mockEmailOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('SENDGRID_API_KEY environment variable is required')
      expect(mockSgMail.send).not.toHaveBeenCalled()
    })

    it('should return error when recipient is missing', async () => {
      const options = {
        ...mockEmailOptions,
        to: '',
      }

      const result = await service.sendEmail(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email recipient (to) is required')
      expect(mockSgMail.send).not.toHaveBeenCalled()
    })

    it('should return error when subject is missing', async () => {
      const options = {
        ...mockEmailOptions,
        subject: '',
      }

      const result = await service.sendEmail(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email subject is required')
      expect(mockSgMail.send).not.toHaveBeenCalled()
    })

    it('should return error when both HTML and text content are missing', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
      }

      const result = await service.sendEmail(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email must have either HTML or text content')
      expect(mockSgMail.send).not.toHaveBeenCalled()
    })

    it('should handle SendGrid API errors', async () => {
      const apiError = new Error('SendGrid API Error')
      mockSgMail.send.mockRejectedValue(apiError)

      const result = await service.sendEmail(mockEmailOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('SendGrid API Error')
    })

    it('should handle string errors', async () => {
      mockSgMail.send.mockRejectedValue('String error')

      const result = await service.sendEmail(mockEmailOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('String error')
    })

    it('should handle unknown error types', async () => {
      mockSgMail.send.mockRejectedValue({ someProperty: 'value' })

      const result = await service.sendEmail(mockEmailOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error occurred')
    })

    it('should handle errors with message property', async () => {
      mockSgMail.send.mockRejectedValue({ message: 'Custom error message' })

      const result = await service.sendEmail(mockEmailOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Custom error message')
    })
  })

  describe('sendTestEmail', () => {
    beforeEach(() => {
      const mockResponse = {
        statusCode: 202,
        headers: { 'x-message-id': 'test-id' },
      }
      mockSgMail.send.mockResolvedValue([mockResponse as ClientResponse, {}])
    })

    it('should send test email with correct content', async () => {
      const result = await service.sendTestEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email from SaaS Sale Orders',
          html: expect.stringContaining('Test Email'),
          text: expect.stringContaining('Test Email'),
        })
      )
    })

    it('should include timestamp in test email', async () => {
      await service.sendTestEmail('test@example.com')

      const callArgs = mockSgMail.send.mock.calls[0][0] as any
      expect(callArgs.html).toMatch(/Timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(callArgs.text).toMatch(/Timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('validateConfiguration', () => {
    it('should return valid when all environment variables are set', async () => {
      const result = await service.validateConfiguration()

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid when SENDGRID_API_KEY is missing', async () => {
      delete process.env.SENDGRID_API_KEY

      const result = await service.validateConfiguration()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('SENDGRID_API_KEY environment variable is missing')
    })

    it('should warn when SENDGRID_FROM_EMAIL is missing', async () => {
      delete process.env.SENDGRID_FROM_EMAIL

      const result = await service.validateConfiguration()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'SENDGRID_FROM_EMAIL environment variable is missing (using default)'
      )
    })

    it('should return multiple errors when multiple variables are missing', async () => {
      delete process.env.SENDGRID_API_KEY
      delete process.env.SENDGRID_FROM_EMAIL

      const result = await service.validateConfiguration()

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('SENDGRID_API_KEY environment variable is missing')
      expect(result.errors).toContain(
        'SENDGRID_FROM_EMAIL environment variable is missing (using default)'
      )
    })
  })

  describe('singleton instance', () => {
    it('should export a singleton emailService instance', () => {
      expect(emailService).toBeInstanceOf(EmailService)
    })

    it('should return the same instance', () => {
      expect(emailService).toBe(emailService)
    })
  })

  describe('console logging', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockResponse = {
        statusCode: 202,
        headers: { 'x-message-id': 'test-id' },
      }
      mockSgMail.send.mockResolvedValue([mockResponse as ClientResponse, {}])
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log email sending information', async () => {
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      })

      expect(consoleSpy).toHaveBeenCalledWith('[EmailService] Sending email to: test@example.com')
      expect(consoleSpy).toHaveBeenCalledWith('[EmailService] Subject: Test Subject')
      expect(consoleSpy).toHaveBeenCalledWith('[EmailService] Email sent successfully. Status: 202')
    })

    it('should log multiple recipients correctly', async () => {
      await service.sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test</p>',
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EmailService] Sending email to: test1@example.com, test2@example.com'
      )
    })
  })
})

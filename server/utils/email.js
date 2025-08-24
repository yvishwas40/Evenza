import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'demo@example.com',
      pass: process.env.SMTP_PASS || 'demo_password'
    }
  });
};

export const sendConfirmationEmail = async (attendee, event) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'demo@example.com',
      to: attendee.email,
      subject: `Registration Confirmed: ${event.title}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Registration Confirmed!</h2>
          <p>Dear ${attendee.name},</p>
          <p>Thank you for registering for <strong>${event.title}</strong>!</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details:</h3>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Registration ID:</strong> ${attendee.registrationId}</p>
          </div>
          
          ${event.isVirtual ? `
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #10b981;">Virtual Event Access</h3>
              <p>Join the meeting: <a href="${event.zoomLink}" style="color: #3B82F6;">${event.zoomLink}</a></p>
              <p><strong>Meeting ID:</strong> ${event.meetingId}</p>
            </div>
          ` : ''}
          
          ${event.isPaid && attendee.paymentStatus === 'pending' ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #f59e0b;">Payment Required</h3>
              <p>Please complete your payment to secure your spot.</p>
              <p><strong>Amount:</strong> $${event.ticketPrice}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <h3>Your QR Code for Check-in</h3>
            <img src="data:image/png;base64,${attendee.qrCode.split(',')[1]}" alt="QR Code" style="border: 1px solid #e5e7eb; border-radius: 8px;"/>
            <p style="color: #6b7280; font-size: 14px;">Present this QR code at the event for quick check-in</p>
          </div>
          
          <p>Looking forward to seeing you at the event!</p>
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `
    };

    // In development, just log the email instead of sending
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email would be sent:', mailOptions);
      return { success: true, message: 'Email logged (development mode)' };
    }

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Confirmation email sent' };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, message: error.message };
  }
};

export const sendReminderEmail = async (attendee, event, customContent) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'demo@example.com',
      to: attendee.email,
      subject: customContent.subject || `Reminder: ${event.title}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Event Reminder</h2>
          <p>Dear ${attendee.name},</p>
          <p>${customContent.message}</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details:</h3>
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
          </div>
          
          ${event.isVirtual ? `
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #10b981;">Join Virtual Event</h3>
              <p><a href="${event.zoomLink}" style="color: #3B82F6; font-weight: bold;">Click here to join</a></p>
            </div>
          ` : ''}
          
          <p>See you there!</p>
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('Reminder email would be sent:', mailOptions);
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Reminder email error:', error);
    return { success: false, message: error.message };
  }
};

export const sendBroadcastEmail = async (attendee, event, content) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'demo@example.com',
      to: attendee.email,
      subject: content.subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">${content.subject}</h2>
          <p>Dear ${attendee.name},</p>
          <div style="margin: 20px 0; line-height: 1.6;">
            ${content.content.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 30px 0; border: none; height: 1px; background: #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This message is regarding: <strong>${event.title}</strong><br>
            Event Date: ${new Date(event.date).toLocaleDateString()}
          </p>
        </div>
      `
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('Broadcast email would be sent:', mailOptions);
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Broadcast email error:', error);
    throw error;
  }
};

export const sendSurveyEmail = async (attendee, event, surveyData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'demo@example.com',
      to: attendee.email,
      subject: `Survey: ${event.title}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Help Us Improve!</h2>
          <p>Dear ${attendee.name},</p>
          <p>Thank you for attending <strong>${event.title}</strong>!</p>
          <p>${surveyData.customMessage || 'We would love to hear your feedback to help us improve future events.'}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${surveyData.surveyUrl}?attendee=${attendee._id}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Take Survey
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This survey will only take a few minutes and will help us create better events in the future.
          </p>
          
          <p>Thank you for your time!</p>
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('Survey email would be sent:', mailOptions);
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Survey email error:', error);
    throw error;
  }
};
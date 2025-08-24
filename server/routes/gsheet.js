import express from 'express';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import { setupGoogleSheet, getSheetData } from '../utils/gsheet.js';

const router = express.Router();

// Setup Google Sheets integration
router.post('/setup/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { spreadsheetId, appScriptUrl } = req.body;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event with Google Sheets info
    event.gsheetId = spreadsheetId;
    event.appScriptUrl = appScriptUrl;
    await event.save();

    // Setup the sheet with headers
    await setupGoogleSheet(event);

    res.json({
      message: 'Google Sheets integration setup successfully',
      spreadsheetId,
      appScriptUrl
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Google Sheets data
router.get('/data/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.appScriptUrl) {
      return res.status(400).json({ message: 'Google Sheets not configured for this event' });
    }

    const sheetData = await getSheetData(event);
    res.json(sheetData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate Apps Script code
router.get('/appscript-code/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const appScriptCode = `
// Event Management Apps Script Integration
// Event: ${event.title}
// Generated on: ${new Date().toISOString()}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (data.action === 'registration') {
      addRegistration(sheet, data.attendee);
    } else if (data.action === 'checkin') {
      updateCheckIn(sheet, data.attendee);
    } else if (data.action === 'payment') {
      updatePayment(sheet, data.attendee);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, 
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addRegistration(sheet, attendee) {
  const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'Organization', 'Registration Date', 'Payment Status', 'Check-in Status', 'Check-in Time'];
  
  // Add headers if this is the first row
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const newRow = [
    attendee.registrationId,
    attendee.name,
    attendee.email,
    attendee.phone,
    attendee.organization || '',
    new Date(attendee.createdAt),
    attendee.paymentStatus,
    attendee.checkInStatus,
    attendee.checkInTime ? new Date(attendee.checkInTime) : ''
  ];
  
  sheet.appendRow(newRow);
}

function updateCheckIn(sheet, attendee) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === attendee.registrationId) {
      sheet.getRange(i + 1, 8).setValue('checked_in');
      sheet.getRange(i + 1, 9).setValue(new Date(attendee.checkInTime));
      break;
    }
  }
}

function updatePayment(sheet, attendee) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === attendee.registrationId) {
      sheet.getRange(i + 1, 7).setValue(attendee.paymentStatus);
      break;
    }
  }
}

// Function to generate QR code using Google Charts API
function generateQRCode(text) {
  const url = 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' + encodeURIComponent(text);
  return url;
}

// Function to send email with QR code
function sendQRCodeEmail(email, name, qrData) {
  const qrUrl = generateQRCode(qrData);
  const htmlBody = \`
    <h2>Your Event QR Code</h2>
    <p>Dear \${name},</p>
    <p>Thank you for registering! Here's your QR code for event check-in:</p>
    <img src="\${qrUrl}" alt="QR Code" />
    <p>Please present this QR code at the event for quick check-in.</p>
  \`;
  
  MailApp.sendEmail({
    to: email,
    subject: '${event.title} - Your QR Code',
    htmlBody: htmlBody
  });
}
`;

    res.json({
      code: appScriptCode,
      instructions: [
        '1. Open Google Apps Script (script.google.com)',
        '2. Create a new project',
        '3. Replace the default code with the generated code above',
        '4. Save the project',
        '5. Deploy as a web app',
        '6. Set execution as "Me" and access as "Anyone"',
        '7. Copy the web app URL and use it in the setup'
      ]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
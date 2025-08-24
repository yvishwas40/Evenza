import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a mock Zoom meeting link.
 * In a real application, this would involve an API call to Zoom.
 * @param {string} topic - The topic of the meeting.
 * @param {Date} startTime - The start time of the meeting.
 * @returns {{ joinUrl: string, meetingId: string }}
 */
export const generateZoomLink = (topic, startTime) => {
  // Generate a random meeting ID (numeric)
  const meetingId = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

  // Generate a fake join URL
  const joinUrl = `https://zoom.us/j/${meetingId}?pwd=${uuidv4().replace(/-/g, '')}`;

  console.log(`Generated mock Zoom link for topic: "${topic}" at ${startTime}`);

  return {
    joinUrl,
    meetingId,
  };
};


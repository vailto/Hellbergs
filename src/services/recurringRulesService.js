// Recurring Rules API service
// Handles communication with backend /api/recurring-rules endpoints

const API_BASE = '/api/recurring-rules';

export async function createRecurringRule({ templateBooking, startDate, repeatWeeks, weeksAhead }) {
  if (!templateBooking || !startDate) {
    throw new Error('templateBooking and startDate are required');
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateBooking,
        startDate,
        repeatWeeks: Number(repeatWeeks) || 1,
        weeksAhead: Number(weeksAhead) || 12,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create recurring rule: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating recurring rule:', error);
    throw error;
  }
}

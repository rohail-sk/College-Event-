/**
 * Utility functions to handle errors without exposing sensitive information
 */

/**
 * Handle errors without logging sensitive information to the console
 * @param {Error} error - The error object
 * @param {string} context - A short description of where the error occurred
 * @returns {string} A safe error message for the user
 */
export const handleError = (error, context = '') => {
  // In production, don't log anything
  // In development, you could enable this for debugging
  // console.error(`Error in ${context}:`, error);
  
  // Return a generic error message that's safe to show to users
  if (error?.response?.data?.message) {
    // Use the message from the API if available
    return error.response.data.message;
  } else if (error?.message) {
    // Use the error message if available
    return error.message;
  } else {
    // Default generic message
    return `An error occurred${context ? ' while ' + context : ''}. Please try again.`;
  }
};

/**
 * Process API responses without logging sensitive data
 * @param {Object} response - The API response
 * @returns {boolean} Whether the response is successful
 */
export const isSuccessResponse = (response) => {
  if (!response) return false;
  
  // Check common success status codes
  if (response.status >= 200 && response.status < 300) {
    return true;
  }
  
  // Check for specific success indicators in response data
  if (response.data && 
      (response.data.status === 'Success' || 
       response.data.status === 'Registered' || 
       response.data.status === 'Cancelled')) {
    return true;
  }
  
  return false;
};

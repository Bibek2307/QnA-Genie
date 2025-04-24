export const formatDateTime = (dateString) => {
  // Create date object and explicitly handle timezone
  const date = new Date(dateString);
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  // Format date as dd-mm-yyyy
  const day = utcDate.getDate().toString().padStart(2, '0');
  const month = (utcDate.getMonth() + 1).toString().padStart(2, '0');
  const year = utcDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  
  // Format time in 12-hour format with AM/PM
  let hours = utcDate.getHours();
  const minutes = utcDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  const formattedTime = `${hours}:${minutes} ${ampm}`;

  return `${formattedDate} ${formattedTime}`;
};

// Helper function to format time for input fields
export const formatTimeForInput = (date) => {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const hours = utcDate.getHours().toString().padStart(2, '0');
  const minutes = utcDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}; 
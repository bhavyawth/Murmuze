export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleTimeString([], options);
}
const ensureUTC = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return dateString + 'Z';
  }
  return dateString;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(ensureUTC(dateString));
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(ensureUTC(dateString));
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(ensureUTC(dateString));
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

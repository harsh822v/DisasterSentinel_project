// Define enums to match the client-side types
export enum DisasterType {
  Earthquake = "earthquake",
  Flood = "flood",
  Storm = "storm",
  Wildfire = "wildfire"
}

export enum AlertType {
  Warning = "warning",
  Watch = "watch",
  Advisory = "advisory"
}

// Map API time range parameter to appropriate values for each API
export function mapTimeRangeToValue(timeRange: string): string {
  switch (timeRange) {
    case '1h':
    case 'hour':
      return 'hour';
    case '24h':
    case '1d':
    case '1day':
      return '1day';
    case '7d':
    case '7days':
    case 'week':
      return '7days';
    case '30d':
    case '30days':
    case 'month':
      return '30days';
    default:
      return '1day'; // Default
  }
}

// Format a date for display
export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Calculate time ago string
export function getTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHrs < 24) {
    return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

// Get color for an alert type
export function getAlertTypeColor(alertType: AlertType): string {
  switch (alertType) {
    case AlertType.Warning:
      return 'red';
    case AlertType.Watch:
      return 'amber';
    case AlertType.Advisory:
      return 'green';
    default:
      return 'blue';
  }
}

// Get icon for a disaster type
export function getDisasterIcon(type: DisasterType): string {
  switch (type) {
    case DisasterType.Earthquake:
      return 'vibration';
    case DisasterType.Flood:
      return 'water';
    case DisasterType.Storm:
      return 'bolt';
    case DisasterType.Wildfire:
      return 'local_fire_department';
    default:
      return 'warning';
  }
}

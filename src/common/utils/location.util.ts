import geoip from 'geoip-lite';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * Extracts and formats geographical location from IP address.
 */
export function getLocationFromIp(ipAddress?: string | null): string {
  if (!ipAddress) {
    return 'Unknown Location';
  }

  // Clean IPv6 mapped IPv4 prefix (e.g. ::ffff:127.0.0.1)
  const cleanIp = ipAddress.replace(/^::ffff:/, '').trim();

  // Check for local / loopback / private IP addresses
  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.16.') ||
    cleanIp.startsWith('172.17.') ||
    cleanIp.startsWith('172.18.') ||
    cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.20.') ||
    cleanIp.startsWith('172.30.') ||
    cleanIp.startsWith('172.31.')
  ) {
    return 'Local Network';
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (!geo) {
      return 'Unknown Location';
    }

    const countryName = geo.country ? regionNames.of(geo.country) || geo.country : '';

    if (geo.city && countryName) {
      return `${geo.city}, ${countryName}`;
    }
    if (countryName) {
      return countryName;
    }
    if (geo.city) {
      return geo.city;
    }
  } catch {
    // Fallback if lookup fails
  }

  return 'Unknown Location';
}

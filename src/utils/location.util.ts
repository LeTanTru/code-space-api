// eslint-disable-next-line @typescript-eslint/no-require-imports
const geoip = require('geoip-lite');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

let cachedPublicIp: string | null = null;

const safeGeoLookup = (ip: string) => {
  try {
    const fn = geoip?.lookup || geoip?.default?.lookup;
    if (typeof fn === 'function') {
      return fn(ip);
    }
  } catch {
    // Ignore lookup errors
  }
  return null;
};

/**
 * Attempts to resolve and cache public IP address when running locally
 */
export const refreshPublicIpCache = async (): Promise<string | null> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) return null;
    const data = (await res.json()) as { ip?: string };
    if (data?.ip) {
      cachedPublicIp = data.ip;
      return data.ip;
    }
  } catch {
    // Ignore network errors
  }
  return null;
};

// Warm up cache immediately
refreshPublicIpCache().catch(() => {});

export const isLocalIp = (ip: string): boolean => {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
};

/**
 * Resolves local/loopback IP addresses to the machine's actual public IP if available.
 */
export const resolvePublicIp = (ipAddress?: string | null): string => {
  if (!ipAddress) return cachedPublicIp || '127.0.0.1';
  const cleanIp = ipAddress.replace(/^::ffff:/, '').trim();
  if (isLocalIp(cleanIp) && cachedPublicIp) {
    return cachedPublicIp;
  }
  return cleanIp;
};

/**
 * Extracts and formats geographical location from IP address.
 */
export const getLocationFromIp = (ipAddress?: string | null): string => {
  if (!ipAddress) {
    return 'Unknown Location';
  }

  // Clean IPv6 mapped IPv4 prefix (e.g. ::ffff:127.0.0.1)
  const cleanIp = ipAddress.replace(/^::ffff:/, '').trim();

  // If local / loopback / private IP, use cached public IP if available
  let targetIp = cleanIp;
  if (isLocalIp(cleanIp)) {
    if (cachedPublicIp) {
      targetIp = cachedPublicIp;
    } else {
      // Trigger background refresh for subsequent calls
      refreshPublicIpCache().catch(() => {});
    }
  }

  try {
    const geo = safeGeoLookup(targetIp);
    if (geo) {
      const countryName = geo.country ? regionNames.of(geo.country) || geo.country : '';
      if (geo.city && countryName) return `${geo.city}, ${countryName}`;
      if (countryName) return countryName;
      if (geo.city) return geo.city;
    }
  } catch {
    // Fallback if lookup fails
  }

  return 'Unknown Location';
};

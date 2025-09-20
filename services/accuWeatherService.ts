import type { WeatherData } from '../types';

// Open-Meteo API - pulsuz və API açarı tələb etmir
const OPENMETEO_BASE = 'https://api.open-meteo.com/v1';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';

export interface OpenMeteoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // region/state
  admin2?: string; // city/district
}

interface OpenMeteoWeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

// Weather code to Azerbaijani description mapping
const weatherCodeToAz: Record<number, string> = {
  0: 'Açıq səma',
  1: 'Əsasən açıq',
  2: 'Qismən buludlu',
  3: 'Buludlu',
  45: 'Dumanlı',
  48: 'Buzlu duman',
  51: 'Yüngül çiskin',
  53: 'Orta çiskin',
  55: 'Güclü çiskin',
  61: 'Yüngül yağış',
  63: 'Orta yağış',
  65: 'Güclü yağış',
  71: 'Yüngül qar',
  73: 'Orta qar',
  75: 'Güclü qar',
  80: 'Leysan yağış',
  81: 'Güclü leysan',
  82: 'Çox güclü leysan',
  95: 'İldırım',
  96: 'Dolu ilə ildırım',
  99: 'Güclü dolu'
};

function getWeatherDescription(code: number): string {
  return weatherCodeToAz[code] || 'Naməlum';
}

function toAzWeekday(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('az-AZ', { weekday: 'short' });
  } catch {
    return dateStr;
  }
}

// Fetch helper with timeout
const DEFAULT_TIMEOUT = 10000; // 10s
async function fetchWithTimeout(url: string, timeoutMs: number = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Xidmət cavab vermədi (timeout). Bir qədər sonra yenidən cəhd edin.');
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export async function searchCityAutocomplete(query: string, lang: string = 'az'): Promise<OpenMeteoLocation[]> {
  if (!query.trim() || query.length < 2) return [];
  
  const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(query)}&count=10&language=${lang}&format=json`;
  
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      // Fallback to English if Azerbaijani fails
      if (lang !== 'en') {
        return searchCityAutocomplete(query, 'en');
      }
      throw new Error(`Məkan axtarışı uğursuz oldu (HTTP ${res.status})`);
    }
    
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country,
      admin1: item.admin1,
      admin2: item.admin2,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Məkan təklifləri alına bilmədi');
  }
}

export async function getTopCities(limit: number = 50, lang: string = 'az'): Promise<OpenMeteoLocation[]> {
  // Popular cities list for Azerbaijan and region
  const popularCities = [
    'Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Quba', 'Lankaran', 'Shaki', 'Yevlax',
    'Istanbul', 'Ankara', 'Moscow', 'London', 'Paris', 'Berlin', 'New York', 'Tokyo',
    'Dubai', 'Tehran', 'Tbilisi', 'Yerevan', 'Kiev', 'Warsaw', 'Rome', 'Madrid'
  ];

  const results: OpenMeteoLocation[] = [];
  
  for (const city of popularCities.slice(0, Math.min(limit, 24))) {
    try {
      const cityResults = await searchCityAutocomplete(city, lang);
      if (cityResults.length > 0) {
        results.push(cityResults[0]);
      }
    } catch {
      // Skip failed cities
    }
  }
  
  return results.slice(0, limit);
}

async function getCurrentWeather(lat: number, lon: number): Promise<OpenMeteoWeatherResponse> {
  const url = `${OPENMETEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=6`;
  
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`Hava məlumatı alına bilmədi (HTTP ${res.status})`);
  }
  
  return await res.json();
}

export async function getWeatherByCityName(city: string, lang: string = 'az'): Promise<WeatherData> {
  const locations = await searchCityAutocomplete(city, lang);
  if (!locations.length) {
    throw new Error('Məkan tapılmadı');
  }
  
  const location = locations[0];
  const weather = await getCurrentWeather(location.latitude, location.longitude);
  
  const locationName = `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}, ${location.country}`;
  
  const forecast = weather.daily.time.slice(0, 5).map((date, idx) => ({
    day: toAzWeekday(date),
    temp: Math.round((weather.daily.temperature_2m_max[idx] + weather.daily.temperature_2m_min[idx]) / 2),
    condition: getWeatherDescription(weather.daily.weather_code[idx]),
  }));

  return {
    location: locationName,
    current: {
      temp: Math.round(weather.current.temperature_2m),
      condition: getWeatherDescription(weather.current.weather_code),
    },
    forecast,
  };
}

export async function getWeatherByLocationKey(locationId: string, lang: string = 'az'): Promise<WeatherData> {
  // For Open-Meteo, we need to parse lat,lon from locationId
  const [lat, lon] = locationId.split(',').map(Number);
  
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Etibarsız məkan identifikatoru');
  }
  
  const weather = await getCurrentWeather(lat, lon);
  
  const forecast = weather.daily.time.slice(0, 5).map((date, idx) => ({
    day: toAzWeekday(date),
    temp: Math.round((weather.daily.temperature_2m_max[idx] + weather.daily.temperature_2m_min[idx]) / 2),
    condition: getWeatherDescription(weather.daily.weather_code[idx]),
  }));

  return {
    location: 'Seçilmiş məkan',
    current: {
      temp: Math.round(weather.current.temperature_2m),
      condition: getWeatherDescription(weather.current.weather_code),
    },
    forecast,
  };
}

// Compatibility interface for existing code
export interface AccuCitySuggestion {
  Key: string;
  LocalizedName: string;
  Country: { LocalizedName: string };
  AdministrativeArea?: { LocalizedName: string };
}

// Convert OpenMeteo location to AccuWeather-compatible format
export function convertToAccuFormat(location: OpenMeteoLocation): AccuCitySuggestion {
  return {
    Key: `${location.latitude},${location.longitude}`, // Use coordinates as key
    LocalizedName: location.name,
    Country: { LocalizedName: location.country },
    AdministrativeArea: location.admin1 ? { LocalizedName: location.admin1 } : undefined,
  };
}
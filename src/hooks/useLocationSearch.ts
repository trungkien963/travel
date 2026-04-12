import { useState, useEffect } from 'react';

export interface LocationResult {
  placeId: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
}

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Using OpenStreetMap Nominatim - 100% FREE API, NO KEY REQUIRED!
        // Adding countrycodes=vn bounds search to Vietnam natively
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=vn`,
          {
            headers: {
               // Nominatim requires a user-agent
               'User-Agent': 'WanderPoolTravelApp/1.0',
            }
          }
        );
        const data = await response.json();
        
        const formattedResults: LocationResult[] = data.map((item: any) => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.province || addr.state || 'Việt Nam';
          const name = addr.tourism || addr.cafe || addr.restaurant || addr.aerodrome || item.name || city;
          
          return {
            placeId: item.place_id.toString(),
            name: name,
            city: city,
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          };
        });

        // Unique by place name
        const unique = formattedResults.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
        setResults(unique);
      } catch (error) {
        console.error("Location search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce to prevent spamming OSM API

    return () => clearTimeout(timer);
  }, [query]);

  return {
    query,
    setQuery,
    results,
    isSearching
  };
}

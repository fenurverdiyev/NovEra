import { useState, useEffect } from 'react';

interface GeolocationState {
    countryCode: string | null;
    loading: boolean;
    error: string | null;
}

const getCountryFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    // Using a free, key-less reverse geocoding API
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
    if (!response.ok) {
        throw new Error('Reverse geocoding failed');
    }
    const data = await response.json();
    return data.countryCode.toLowerCase();
};


export const useGeolocation = (): GeolocationState => {
    const [state, setState] = useState<GeolocationState>({
        countryCode: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState({ loading: false, error: 'Geolocation is not supported by your browser.', countryCode: null });
            return;
        }

        const success = async (position: GeolocationPosition) => {
            try {
                const countryCode = await getCountryFromCoords(position.coords.latitude, position.coords.longitude);
                setState({ loading: false, error: null, countryCode });
            } catch (error) {
                setState({ loading: false, error: 'Could not determine country from location.', countryCode: null });
            }
        };

        const error = () => {
            setState({ loading: false, error: 'Unable to retrieve your location.', countryCode: null });
        };

        navigator.geolocation.getCurrentPosition(success, error);
    }, []);

    return state;
};

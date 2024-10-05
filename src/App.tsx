import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox access token here
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const skateparks: { name: string; coordinates: [number, number] }[] = [
  { name: 'Skatepark 1', coordinates: [-73.5673, 45.5017] },
  { name: 'Skatepark 2', coordinates: [-73.5773, 45.5117] },
  { name: 'Skatepark 3', coordinates: [-73.5873, 45.5217] },
];

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null); // Reference for map container
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<string>(''); // For address input

  // Initialize the map after user location is obtained
  useEffect(() => {
    if (!mapContainer.current || map) return; // Ensure the container is available and the map isn't already initialized

    // Get the user's current location
    navigator.geolocation.getCurrentPosition((position) => {
      const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
      setUserCoordinates(coordinates);

      // Initialize the Mapbox map instance
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: coordinates,
        zoom: 12,
      });

      setMap(mapInstance);

      // Add user's location marker
      new mapboxgl.Marker({ color: 'blue' })
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup().setText("You are here"))
        .addTo(mapInstance);

      // Add skatepark markers and handle routing when clicked
      skateparks.forEach((park) => {
        const marker = new mapboxgl.Marker()
          .setLngLat(park.coordinates)
          .setPopup(new mapboxgl.Popup().setText(park.name))
          .addTo(mapInstance);

        marker.getElement().addEventListener('click', () => {
          getRoute(coordinates, park.coordinates, mapInstance);
        });
      });

      return () => mapInstance.remove(); // Cleanup map on component unmount
    });
  }, [map]); // Run only once, and only re-run if `map` hasn't been initialized

  // Handle address input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
  };

  // Fetch route using address
  const handleAddressSearch = () => {
    if (!destination || !userCoordinates || !map) return;

    // Convert address to coordinates using Mapbox Geocoding API
    const geocodingRequest = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${mapboxgl.accessToken}`;

    fetch(geocodingRequest)
      .then((response) => response.json())
      .then((data) => {
        if (data.features.length > 0) {
          const destinationCoordinates = data.features[0].center; // Get the coordinates of the address
          getRoute(userCoordinates, destinationCoordinates as [number, number], map);
        } else {
          alert("Address not found");
        }
      });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Map Container */}
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} /> {/* Fullscreen map */}

      {/* Search Bar inside the Map */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1, // Ensure it appears on top of the map
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <input
          type="text"
          placeholder="Enter destination address"
          value={destination}
          onChange={handleInputChange}
          style={{ width: '300px', padding: '5px' }}
        />
        <button onClick={handleAddressSearch} style={{ marginLeft: '10px', padding: '5px 10px' }}>
          Get Route
        </button>
      </div>
    </div>
  );
};

// Function to calculate and display route
const getRoute = (start: [number, number], end: [number, number], map: mapboxgl.Map) => {
  const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.join(',')};${end.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

  fetch(directionsRequest)
    .then((response) => response.json())
    .then((data) => {
      const route = data.routes[0].geometry;
      const travelTime = data.routes[0].duration / 60; // Convert from seconds to minutes

      if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
      }

      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route,
          },
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 4,
        },
      });

      alert(`Estimated skateboard travel time: ${travelTime.toFixed(2)} minutes`);
    });
};

export default Map;

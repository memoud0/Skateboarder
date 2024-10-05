import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox access token here
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const skateparks: { name: string; coordinates: [number, number] }[] = [
  { name: 'Skatepark 1', coordinates: [-73.5673, 45.5017] },
  { name: 'Skatepark 2', coordinates: [-73.5773, 45.5117] },
  { name: 'Skatepark 3', coordinates: [-73.5873, 45.5217] },
];


const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null); // TypeScript: mapContainer is initialized as null

  useEffect(() => {
    if (!mapContainer.current) return; // Ensure the container exists before initializing the map

    const map = new mapboxgl.Map({
      container: mapContainer.current!, // Non-null assertion
      style: 'mapbox://styles/mapbox/streets-v11', // Mapbox style URL
      center: [-73.5673, 45.5017], // Coordinates for Montreal
      zoom: 12, // Adjust zoom level to get a closer view of the city
    });

    // Add skatepark markers to the map
    skateparks.forEach((park) => {
      new mapboxgl.Marker()
        .setLngLat(park.coordinates) // Now correctly typed
        .setPopup(new mapboxgl.Popup().setText(park.name)) // Add popup with skatepark name
        .addTo(map);
    });

    // Clean up the map instance when the component is unmounted
    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '90vw', // 90% of the viewport width for horizontal expansion
        height: '600px', // Fixed height for a more horizontal layout
        margin: '0 auto', // Center the map horizontally
      }}
    />
  );
};

export default Map;

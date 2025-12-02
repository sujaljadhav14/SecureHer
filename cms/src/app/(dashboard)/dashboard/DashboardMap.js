"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const DashboardMap = ({ heatmapData }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Make sure the document has loaded before accessing the DOM
    if (typeof window !== "undefined") {
      // Initialize the map if it hasn't been initialized yet
      if (!mapRef.current) {
        // Set default view to Mumbai, India
        const center = [19.076, 72.8777];
        
        // Initialize the map
        const map = L.map("heatmap").setView(center, 12);
        
        // Add the base map layer (OpenStreetMap)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        
        // Store the map instance in the ref
        mapRef.current = map;
      }
      
      // Get the map instance
      const map = mapRef.current;
      
      // Clear any existing layers except the base layer
      map.eachLayer((layer) => {
        if (!layer._url) {
          map.removeLayer(layer);
        }
      });
      
      // Check if we have data
      if (heatmapData && heatmapData.length > 0) {
        // Format data for the heatmap
        const points = heatmapData.map((point) => {
          return [point.lat, point.lng, point.intensity || 1];
        });
        
        // Add the heatmap layer
        L.heatLayer(points, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.2: 'blue',
            0.4: 'cyan',
            0.6: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        }).addTo(map);
        
        // Auto-zoom to fit all points if we have more than one point
        if (points.length > 1) {
          try {
            const latLngs = points.map(p => [p[0], p[1]]);
            const bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds, { padding: [50, 50] });
          } catch (e) {
            console.error("Error auto-zooming map:", e);
          }
        }
      }
    }

    // Clean up the map when the component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [heatmapData]);

  return (
    <div id="heatmap" className="w-full h-full rounded-lg" style={{ minHeight: "250px" }}></div>
  );
};

export default DashboardMap;
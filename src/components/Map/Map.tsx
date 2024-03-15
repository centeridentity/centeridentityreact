import React, { useEffect, ReactElement, useState } from "react";
import {
  GoogleMap,
  GoogleMapProps,
  useJsApiLoader,
  useGoogleMap,
  Marker,
  Polygon,
} from "@react-google-maps/api";
import { geocodeByAddress, getLatLng } from "react-google-places-autocomplete";

const containerStyle = {
  width: "505px",
  height: "400px",
};

declare var window: any;

function drawGrid(map: any, precision: any) {
  const bounds = map.getBounds();
  const ne = bounds.getNorthEast(); // Top right (northeast) corner
  const sw = bounds.getSouthWest(); // Bottom left (southwest) corner

  // Convert precision to a decimal step value
  const stepSize = 1 / Math.pow(10, precision);

  let gridSquares = [];

  // Calculate the number of steps/iterations for latitude and longitude
  for (let lat = sw.lat(); lat < ne.lat(); lat += stepSize) {
    for (let lng = sw.lng(); lng < ne.lng(); lng += stepSize) {
      // Generate the square (cell) for this step
      let paths = [
        { lat: lat + stepSize, lng: lng },
        { lat: lat, lng: lng },
        { lat: lat, lng: lng + stepSize },
        { lat: lat + stepSize, lng: lng + stepSize },
      ];

      // Adjust for precision to ensure consistent grid size
      paths = paths.map((path) => ({
        lat: parseFloat(path.lat.toFixed(precision)),
        lng: parseFloat(path.lng.toFixed(precision)),
      }));

      gridSquares.push(paths);
    }
  }

  // gridSquares now contains paths for drawing the grid cells
  return gridSquares;
}

const Map = (props: any) => {
  const precision = props.precision || 4;
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: props.googleApi,
  });
  const [map, setMap]: [map: any, setMap: any] = React.useState(null);
  const [overlay, setOverlay]: any = React.useState(null);
  const overlayRef: any = React.useRef(null);

  const onLoad = React.useCallback(
    function callback(map: any) {
      map.setCenter(props.center);
      map.setZoom(props.zoom);
      setMap(map);
      map.addListener("click", (e: any) => {
        map.panTo({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        map.setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        let newZoom;
        if (map.getZoom() < 7) {
          var panes: any = overlayRef.current.getPanes();
          panes.overlayLayer.innerHTML = "";
          newZoom = map.getZoom() + 3;
        }
        if (map.getZoom() > 7) {
          var panes: any = overlayRef.current.getPanes();
          panes.overlayLayer.innerHTML = "";
          newZoom = map.getZoom() + 2;
        }
        if (newZoom > 20) {
          props.setSelectedLocation({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          }); // Ensure we do not exceed zoom level 20
          if (props.overlay && overlayRef.current) {
            var panes: any = overlayRef.current.getPanes();
            var layer = document.createElement("div");
            layer.innerHTML = `<div class="throbbing-icon-success"><h1>Done! Click next to continue.</h1></div>`;
            panes.overlayLayer.innerHTML = "";
            panes.overlayLayer.appendChild(layer);
          }
        }
        map.setZoom(newZoom);
      });
      if (props.overlay) {
        const customOverlay = new google.maps.OverlayView();
        customOverlay.onAdd = function () {
          var layer = document.createElement("div");
          layer.innerHTML = `<div class="throbbing-icon"><h1>Zoom into your secret location</h1></div>`;
          var panes: any = this.getPanes();
          panes.overlayLayer.innerHTML = "";
          panes.overlayLayer.appendChild(layer);
        };
        customOverlay.draw = function () {};
        customOverlay.setMap(map);
        overlayRef.current = customOverlay; // Store the overlay in the ref
      }
    },
    [props.overlay /* any other dependencies */]
  );

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const triggerInvokedFromParent = () => {
    console.log("TriggerInvokedFromParent");
    geocodeByAddress(props.place.label)
      .then((results: any) => getLatLng(results[0]))
      .then(({ lat, lng }: { lat: any; lng: any }) => {
        map && map.panTo({ lat, lng });
        map && map.setZoom(7);
      });
  };
  const [showGrid, setShowGrid] = useState(false);
  // Function to draw the grid, modified to check zoom level
  const drawGridIfZoomedIn = () => {
    if (!map) return;
    const zoomLevel = map.getZoom();
    const zoomThreshold = 15; // Example threshold, adjust based on needs

    map.setMapTypeId(props.mapTypeId);
    setShowGrid(zoomLevel >= zoomThreshold);
  };

  useEffect(() => {
    if (map) {
      // Attach zoom change listener
      const listener = map.addListener("zoom_changed", drawGridIfZoomedIn);
      map.addListener("idle", () => {
        if (map.getZoom() > 20 && overlayRef.current) return;
        if (map.getZoom() > 3 && map.getZoom() < 20 && overlayRef.current) {
          var panes: any = overlayRef.current.getPanes();
          if (panes) panes.overlayLayer.innerHTML = "";
        }
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [map]);
  useEffect(() => {
    // Initial check in case the map starts zoomed in
    drawGridIfZoomedIn();
  }, [map]); // Ensure this runs when the map instance becomes available

  useEffect(() => {
    triggerInvokedFromParent();
  }, [props.place]);

  let paths: any[] = [];

  if (
    props.selectedLocation.lat &&
    props.selectedLocation.lng &&
    !props.useGrid
  ) {
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) - 0.00005,
    });
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) - 0.00005,
    });
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) + 0.00005,
    });
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) + 0.00005,
    });
  }
  if (props.drawGrid) {
    drawGrid(map, precision);
  }
  const options = {
    fillColor: "lightblue",
    fillOpacity: 0.5,
    strokeColor: "lightblue",
    strokeOpacity: 1,
    strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 10,
  };
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={props.center}
      zoom={props.zoom || 2}
      onLoad={onLoad}
      onUnmount={onUnmount}
      {...props}
    >
      {props.selectedLocation.lat && props.selectedLocation.lng && (
        <Marker
          position={{
            lat: parseFloat(props.selectedLocation.lat.toFixed(precision)),
            lng: parseFloat(props.selectedLocation.lng.toFixed(precision)),
          }}
        ></Marker>
      )}
      {props.selectedLocation.lat && props.selectedLocation.lng && (
        <Polygon paths={paths} options={options} />
      )}
    </GoogleMap>
  );
};

export default React.memo(Map);

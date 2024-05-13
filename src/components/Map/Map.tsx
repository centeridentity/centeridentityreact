import React, { useEffect, ReactElement, useState } from "react";
import {
  GoogleMap,
  GoogleMapProps,
  useJsApiLoader,
  useGoogleMap,
  Marker,
  Polygon,
} from "@react-google-maps/api";
import GooglePlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-google-places-autocomplete";
import { Loader } from "@googlemaps/js-api-loader";
import { logEvent } from "../../logEvent";

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
  for (let lat = sw.lat() - 0.0001; lat < ne.lat(); lat += stepSize) {
    for (let lng = sw.lng() - 0.0001; lng < ne.lng(); lng += stepSize) {
      // Generate the square (cell) for this step
      let paths = [
        { lat: lat + stepSize, lng: lng },
        { lat: lat, lng: lng },
        { lat: lat, lng: lng + stepSize },
        { lat: lat + stepSize, lng: lng + stepSize },
      ];

      // Adjust for precision to ensure consistent grid size
      paths = paths.map((path) => ({
        lat: parseFloat(path.lat.toFixed(precision)) + 0.00005,
        lng: parseFloat(path.lng.toFixed(precision)) + 0.00005,
      }));

      gridSquares.push({
        id: `lat${lat.toFixed(precision)}lng${lng.toFixed(precision)}`,
        paths,
      });
    }
  }

  // gridSquares now contains paths for drawing the grid cells
  return gridSquares;
}
export interface MapProps {
  selectedLocation?: {
    lat: number;
    lng: number;
  };
  place?: {
    label: string;
  };
  setSelectedLocation?: (location: { lat: number; lng: number }) => void;
  onZoomWithGrid?: () => void;
  onZoomWithoutGrid?: () => void;
  onGridSquareClicked: () => void;
  center?: {
    lat: number;
    lng: number;
  };
  // Add other properties as needed
  drawGrid?: boolean;
  precision?: number;
  zoom?: number;
  overlay?: boolean;
  mapTypeId?: string;
  mapContainerStyle?: {
    width: string;
    height: string;
  };
  options?: any;
}
interface Location {
  lat: number;
  lng: number;
}

const mapStyles = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.province",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
];
const optionsDefault = {
  gestureHandling: "greedy",
  streetViewControl: false,
  styles: mapStyles,
};
const Map = (props: MapProps) => {
  const {
    zoom = 3,
    selectedLocation = { lat: 0, lng: 0 },
    setSelectedLocation = () => {},
    precision: precisionProp = 4,
    center: centerProp = { lat: 0, lng: 0 },
    place = { label: "Portland, Oregon" },
    mapTypeId = "hybrid",
    mapContainerStyle = {
      width: "100%",
      height: "100%",
    },
    options: optionsProp,
    onZoomWithGrid = () => {},
    onZoomWithoutGrid = () => {},
    onGridSquareClicked = () => {},
  } = props;
  const options = optionsProp || optionsDefault;
  const precision = precisionProp || 4;
  const [center, setCenter] = useState(centerProp);
  const [map, setMap]: [map: any, setMap: any] = React.useState(null);
  // const overlayRef: any = React.useRef(null);
  const [showGrid, setShowGrid]: any = useState(false);
  const [gridSquares, setGridSquares]: any = useState([]);
  const [hoverIndex, setHoverIndex] = useState(-1); // State to track hovered polygon
  const [selectedSquareId, setSelectedSquareId] = useState(null);

  const handlePolygonClick = (squareId: any, event: any) => {
    logEvent("click", { target: "Map grid square" });
    onGridSquareClicked();
    setSelectedSquareId(squareId); // Highlight the polygon
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    map.panTo({ lat: lat, lng: lng });
    map.setCenter({ lat: lat, lng: lng });
    let newZoom;
    if (map.getZoom() < 7) {
      // var panes: any = overlayRef.current.getPanes();
      //panes.overlayLayer.innerHTML = "";
      newZoom = map.getZoom() + 3;
    }
    if (map.getZoom() > 7) {
      // var panes: any = overlayRef.current.getPanes();
      //panes.overlayLayer.innerHTML = "";
      newZoom = map.getZoom() + 2;
    }

    setSelectedLocation({ lat, lng }); // Store the coordinates
    map.setZoom(newZoom);
  };
  const handleMouseOver = (index: number) => {
    setHoverIndex(index);
  };

  const handleMouseOut = () => {
    setHoverIndex(-1);
  };
  const onLoad = React.useCallback(
    (map: any) => {
      setMap(map);
      map.setCenter(center);
      map.setZoom(zoom);

      // if (overlay) {
      // const customOverlay = new google.maps.OverlayView();
      // customOverlay.onAdd = function () {
      // var layer = document.createElement("div");
      //layer.innerHTML = `<div class="throbbing-icon"><h1>Zoom into your secret location</h1></div>`;
      //var panes: any = this.getPanes();
      //panes.overlayLayer.innerHTML = "";
      //panes.overlayLayer.appendChild(layer);
      // };
      // customOverlay.draw = function () {};
      // customOverlay.setMap(map);
      // overlayRef.current = customOverlay; // Store the overlay in the ref
      // }
    },
    [
      /* any other dependencies */
    ]
  );

  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);

      const boundsChangedListener = map.addListener("bounds_changed", () => {
        const newCenter = map.getCenter();
        setCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
      });

      return () => google.maps.event.removeListener(boundsChangedListener);
    }
  }, [map, zoom]);

  useEffect(() => {
    if (map && showGrid) {
      setGridSquares(drawGrid(map, precision));
    }
  }, [map, center, precision, showGrid]);

  const mapClicked = (e: any) => {
    logEvent("click", { target: "Map" });
    map.panTo({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    map.setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    let newZoom;
    if (map.getZoom() < 7) {
      // var panes: any = overlayRef.current.getPanes();
      //panes.overlayLayer.innerHTML = "";
      newZoom = map.getZoom() + 3;
    }
    if (map.getZoom() > 7) {
      // var panes: any = overlayRef.current.getPanes();
      //panes.overlayLayer.innerHTML = "";
      newZoom = map.getZoom() + 2;
    }
    if (newZoom > 20) {
      setSelectedLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      }); // Ensure we do not exceed zoom level 20
      // if (overlay && overlayRef.current) {
      //var panes: any = overlayRef.current.getPanes();
      //var layer = document.createElement("div");
      //layer.innerHTML = `<div class="throbbing-icon-success"><h1>Done! Click next to continue.</h1></div>`;
      //panes.overlayLayer.innerHTML = "";
      //panes.overlayLayer.appendChild(layer);
      // }
    }
    map.setZoom(newZoom);
  };

  useEffect(() => {
    if (map) {
      const clickListener = map.addListener("click", mapClicked);
      return () => {
        google.maps.event.removeListener(clickListener);
      };
    }
  }, [map]);

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const triggerInvokedFromParent = () => {
    geocodeByAddress(place.label)
      .then((results: any) => getLatLng(results[0]))
      .then(({ lat, lng }: { lat: any; lng: any }) => {
        map && map.panTo({ lat, lng });
        map && map.setZoom(7);
      });
  };
  // Function to draw the grid, modified to check zoom level
  const drawGridIfZoomedIn = () => {
    if (!map) return;
    const zoomLevel = map.getZoom();
    const zoomThreshold = 18; // Example threshold, adjust based on needs

    map.setMapTypeId(mapTypeId);
    setShowGrid(zoomLevel >= zoomThreshold);
    if (
      !showGrid &&
      zoomLevel >= zoomThreshold &&
      onZoomWithGrid &&
      !selectedSquareId
    ) {
      onZoomWithGrid();
    }
    if (
      !showGrid &&
      zoomLevel < zoomThreshold &&
      onZoomWithoutGrid &&
      !selectedSquareId
    ) {
      onZoomWithoutGrid();
    }
  };

  useEffect(() => {
    if (map) {
      // Attach zoom change listener
      const listener = map.addListener("zoom_changed", drawGridIfZoomedIn);
      map.addListener("idle", () => {
        logEvent("event", { target: "Map idle" });

        // if (map.getZoom() > 20 && overlayRef.current) return;
        // if (map.getZoom() > 3 && map.getZoom() < 20 && overlayRef.current) {
        //   var panes: any = overlayRef.current.getPanes();
        //   if (panes) panes.overlayLayer.innerHTML = "";
        // }
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [map, selectedSquareId]);
  useEffect(() => {
    // Initial check in case the map starts zoomed in
    drawGridIfZoomedIn();
  }, [map]); // Ensure this runs when the map instance becomes available

  useEffect(() => {
    if (isLoaded) triggerInvokedFromParent();
  }, [place]);

  let paths: any[] = [];

  if (selectedLocation.lat && selectedLocation.lng) {
    paths.push({
      lat: parseFloat(selectedLocation.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(selectedLocation.lng.toFixed(precision)) - 0.00005,
    });
    paths.push({
      lat: parseFloat(selectedLocation.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(selectedLocation.lng.toFixed(precision)) - 0.00005,
    });
    paths.push({
      lat: parseFloat(selectedLocation.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(selectedLocation.lng.toFixed(precision)) + 0.00005,
    });
    paths.push({
      lat: parseFloat(selectedLocation.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(selectedLocation.lng.toFixed(precision)) + 0.00005,
    });
  }
  // const options = {
  //   fillColor: "lightblue",
  //   fillOpacity: 0.5,
  //   strokeColor: "lightblue",
  //   strokeOpacity: 1,
  //   strokeWeight: 2,
  //   clickable: false,
  //   draggable: false,
  //   editable: false,
  //   geodesic: false,
  //   zIndex: 100,
  // };
  const [libraries] = useState([]);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDEbmqlzlkU3mErAG-PPdPEbTrv6opHmag",
    libraries: libraries,
  });
  return (
    <>
      {isLoaded && (
        <GoogleMap onLoad={onLoad} onUnmount={onUnmount} {...props}>
          {/* {selectedLocation.lat && selectedLocation.lng && (
          <Marker
            position={{
              lat: parseFloat(selectedLocation.lat.toFixed(precision)),
              lng: parseFloat(selectedLocation.lng.toFixed(precision)),
            }}
          ></Marker>
        )} */}
          {/* {selectedLocation.lat && selectedLocation.lng && (
          <Polygon paths={paths} options={options} />
        )} */}
          {showGrid &&
            gridSquares.map((square: any, index: any) => (
              <Polygon
                key={index}
                paths={square.paths}
                options={{
                  strokeColor:
                    selectedSquareId === square.id ? "lightblue" : "#000000",
                  strokeOpacity: 0.6,
                  strokeWeight: 1,
                  fillColor:
                    selectedSquareId === square.id ? "lightblue" : "#000000",
                  zIndex: 100,
                  clickable: true,
                  fillOpacity:
                    selectedSquareId === square.id
                      ? 0.5
                      : hoverIndex === index
                        ? 0.3
                        : 0.1,
                }}
                onMouseOver={() => handleMouseOver(index)}
                onMouseOut={handleMouseOut}
                onClick={(e) => handlePolygonClick(square.id, e)}
              />
            ))}
        </GoogleMap>
      )}
    </>
  );
};

export default React.memo(Map);

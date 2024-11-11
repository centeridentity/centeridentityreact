import React, { useEffect, ReactElement, useState, useCallback } from "react";
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

function isCoordinateInDisabledLocation(
  coordinate: any,
  disabledLocations: any
) {
  for (const disabledLocation of disabledLocations) {
    const { lat, lng, radius } = disabledLocation;
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(coordinate.lat, coordinate.lng),
      new google.maps.LatLng(lat, lng)
    );
    if (distance <= radius) {
      return true;
    }
  }
  return false;
}

function isSquareInDisabledLocation(square: any, disabledLocations: any) {
  const squareCenter = getSquareCenter(square);
  for (const disabledLocation of disabledLocations) {
    const { lat, lng, radius } = disabledLocation;
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(squareCenter.lat, squareCenter.lng),
      new google.maps.LatLng(lat, lng)
    );
    if (distance <= radius) {
      return true;
    }
  }
  return false;
}

function getSquareCenter(square: any) {
  const paths = square.paths;
  const latSum = paths.reduce((sum: any, point: any) => sum + point.lat, 0);
  const lngSum = paths.reduce((sum: any, point: any) => sum + point.lng, 0);
  const center = {
    lat: latSum / paths.length,
    lng: lngSum / paths.length,
  };
  return center;
}

export interface MapProps {
  selectedLocation?: {
    lat: number;
    lng: number;
  };
  setSelectedLocation?: (location: {
    lat: number;
    lng: number;
    confirmed: boolean;
  }) => void;
  onZoomWithGrid?: (zoomLevel: number) => void;
  onZoomWithoutGrid?: (zoomLevel: number) => void;
  onGridSquareClicked?: (squareId: string) => void;
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  mapContainerStyle?: {
    width: string;
    height: string;
  };
  options?: any;
  getMap?: (map: google.maps.Map) => void;
  setSelectedSquareId?: (squareId: string) => void;
  selectedSquareId?: string;
  disableDefaultUI?: boolean;
  setHoverIndex?: (hoverIndex: number) => void;
  hoverIndex?: number;
  precision?: number;
  disabledLocations?: [
    {
      lat: number;
      lng: number;
      radius: number;
    }?,
  ];
}
interface Location {
  lat: number;
  lng: number;
}

const mapStyles = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
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
    stylers: [{ visibility: "off" }],
  },
];
const optionsDefault = {
  gestureHandling: "greedy",
  streetViewControl: false,
  styles: mapStyles,
  disableDefaultUI: true, // Disable all default UI
  zoomControl: false, // Disable zoom control
};
const Map = (props: MapProps) => {
  const [defaultSelectedLocation, defaultSetSelectedLocation] = useState({
    lat: 0,
    lng: 0,
    confirmed: false,
  });
  const [defaultSelectedSquareId, defaultSetSelectedSquareId] = useState("");
  const [defaultHoverIndex, defaultSetHoverIndex] = useState(-1); // State to track hovered polygon
  const precisionDefault = 4;
  const {
    zoom = 2,
    selectedLocation,
    setSelectedLocation,
    center: centerProp = { lat: 0, lng: 0 },
    mapContainerStyle = {
      width: "100%",
      height: "250px",
    },
    options: optionsProp,
    onZoomWithGrid = () => {},
    onZoomWithoutGrid = () => {},
    onGridSquareClicked = (squareId) => {},
    getMap = (map) => {},
    setSelectedSquareId,
    selectedSquareId,
    disableDefaultUI = true,
    setHoverIndex,
    hoverIndex,
    precision: precisionProp = 4,
    disabledLocations = [],
  } = props;
  const setSelectedLocationHandler =
    setSelectedLocation || defaultSetSelectedLocation;
  const selectedLocationValue = selectedLocation || defaultSelectedLocation;
  const setSelectedSquareIdHandler =
    setSelectedSquareId || defaultSetSelectedSquareId;
  const selectedSquareIdValue = selectedSquareId || defaultSelectedSquareId;
  const setHoverIndexHandler = setHoverIndex || defaultSetHoverIndex;
  const hoverIndexValue = hoverIndex || defaultHoverIndex;
  const mapTypeId = "hybrid";
  const options = optionsProp || optionsDefault;
  const precision = precisionProp || precisionDefault;
  const [center, setCenter] = useState(centerProp);
  const [map, setMap]: [map: any, setMap: any] = useState(null);
  // const overlayRef: any = React.useRef(null);
  const [showGrid, setShowGrid]: any = useState(false);
  const [gridSquares, setGridSquares]: any = useState([]);
  const [mapZoom, setMapZoom] = useState(zoom);

  const handlePolygonClick = (squareId: any, event: any) => {
    logEvent("click", { target: "Map grid square" });
    onGridSquareClicked(squareId);
    setSelectedSquareIdHandler(squareId);
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    map.panTo({ lat: lat, lng: lng });
    map.setCenter({ lat: lat, lng: lng });
    let newZoom;
    let zoomLevel = map.getZoom() || mapZoom;
    if (zoomLevel < 7) {
      // var panes: any = overlayRef.current.getPanes();
      //panes.overlayLayer.innerHTML = "";
      newZoom = zoomLevel + 3;
    }
    if (zoomLevel > 7) {
      // var panes: any = overlayRef.current.getPanes();
      //panes.overlayLayer.innerHTML = "";
      newZoom = zoomLevel;
    }

    setSelectedLocationHandler({ lat, lng, confirmed: false }); // Store the coordinates
    map.setZoom(newZoom);
    setMapZoom(newZoom);
  };
  const handleMouseOver = (index: number) => {
    setHoverIndexHandler(index);
  };

  const handleMouseOut = () => {
    setHoverIndexHandler(-1);
  };
  const onLoad = React.useCallback(
    (map: any) => {
      setMap(map);
      getMap(map);
      map.setCenter(center);
      map.setZoom(zoom);
      setMapZoom(zoom);
      // map.setOptions({
      //   draggableCursor: "default",
      //   draggingCursor: "default",
      // });
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
      setMapZoom(zoom);

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

  const mapClicked = useCallback(
    (e: any) => {
      logEvent("click", { target: "Map" });
      let zoomLevel = map.getZoom() || mapZoom;
      const zoomThreshold = getZoomThreshold();
      console.log(zoomLevel);
      if (
        isCoordinateInDisabledLocation(
          {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          },
          disabledLocations
        ) &&
        zoomLevel > zoomThreshold
      )
        return;
      map.panTo({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      map.setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      let newZoom;
      if (zoomLevel < 7) {
        // var panes: any = overlayRef.current.getPanes();
        //panes.overlayLayer.innerHTML = "";
        newZoom = zoomLevel + 3;
      }
      if (zoomLevel > 7) {
        // var panes: any = overlayRef.current.getPanes();
        //panes.overlayLayer.innerHTML = "";
        newZoom = zoomLevel + 2;
      }
      if (newZoom > 20) {
        setSelectedLocationHandler({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          confirmed: false,
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
      setMapZoom(newZoom);
    },
    [map, showGrid, disabledLocations]
  );

  useEffect(() => {
    if (map) {
      const clickListener = map.addListener("click", mapClicked);
      const keyPressListener = map.addListener("onKeyDown", (e: any) => {
        console.log(e.key);
      });
      return () => {
        google.maps.event.removeListener(clickListener);
        google.maps.event.removeListener(keyPressListener);
      };
    }
  }, [map]);

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const getZoomThreshold = useCallback(() => {
    let zoomThreshold;
    switch (precision) {
      case 2:
        zoomThreshold = 14;
        break;
      case 3:
        zoomThreshold = 16;
        break;
      case 4:
        zoomThreshold = 18;
        break;
      case 5:
        zoomThreshold = 20;
        break;
      case 6:
        zoomThreshold = 20;
        break;
      default:
        zoomThreshold = 18;
    }
    return zoomThreshold;
  }, [precision]);

  // Function to draw the grid, modified to check zoom level
  const drawGridIfZoomedIn = () => {
    if (!map) return;
    const zoomLevel = map.getZoom();
    const zoomThreshold = getZoomThreshold();
    map.setMapTypeId(mapTypeId);
    setShowGrid(zoomLevel >= zoomThreshold);
    if (zoomLevel >= zoomThreshold && onZoomWithGrid) {
      onZoomWithGrid(zoomLevel);
    }
    if (zoomLevel < zoomThreshold && onZoomWithoutGrid) {
      onZoomWithoutGrid(zoomLevel);
    }
  };

  useEffect(() => {
    if (map) {
      // Attach zoom change listener
      const listener = map.addListener("zoom_changed", drawGridIfZoomedIn);
      map.addListener("idle", () => {
        //logEvent("event", { target: "Map idle" });
        // if (map.getZoom() > 20 && overlayRef.current) return;
        // if (map.getZoom() > 3 && map.getZoom() < 20 && overlayRef.current) {
        //   var panes: any = overlayRef.current.getPanes();
        //   if (panes) panes.overlayLayer.innerHTML = "";
        // }
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [map, showGrid]);
  useEffect(() => {
    // Initial check in case the map starts zoomed in
    drawGridIfZoomedIn();
  }, [map]); // Ensure this runs when the map instance becomes available

  let paths: any[] = [];

  if (selectedLocationValue.lat && selectedLocationValue.lng) {
    paths.push({
      lat: parseFloat(selectedLocationValue.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(selectedLocationValue.lng.toFixed(precision)) - 0.00005,
    });
    paths.push({
      lat: parseFloat(selectedLocationValue.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(selectedLocationValue.lng.toFixed(precision)) - 0.00005,
    });
    paths.push({
      lat: parseFloat(selectedLocationValue.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(selectedLocationValue.lng.toFixed(precision)) + 0.00005,
    });
    paths.push({
      lat: parseFloat(selectedLocationValue.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(selectedLocationValue.lng.toFixed(precision)) + 0.00005,
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
  const [libraries] = useState([
    "places",
    "geometry",
    "localContext",
    "drawing",
    "visualization",
  ]);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDEbmqlzlkU3mErAG-PPdPEbTrv6opHmag",
    libraries: libraries as any,
  });
  return (
    <>
      {isLoaded && (
        <GoogleMap
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={options}
          {...props}
        >
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
            gridSquares.map((square: any, index: any) => {
              const isDisabled = isSquareInDisabledLocation(
                square,
                disabledLocations
              );
              return (
                <Polygon
                  key={index}
                  paths={square.paths}
                  options={{
                    strokeColor:
                      selectedSquareIdValue === square.id
                        ? "lightgreen"
                        : isDisabled
                          ? "red"
                          : "#000000",
                    strokeOpacity: 0.8,
                    strokeWeight: selectedSquareIdValue === square.id ? 5 : 1,
                    fillColor:
                      selectedSquareIdValue === square.id
                        ? "lightgreen"
                        : isDisabled
                          ? "red"
                          : "#000000",
                    fillOpacity:
                      selectedSquareIdValue === square.id
                        ? 0.5
                        : hoverIndexValue === index
                          ? 0.3
                          : 0.1,
                    clickable: !isDisabled,
                    zIndex: selectedSquareIdValue === square.id ? 1000 : 100,
                  }}
                  onMouseOver={() => handleMouseOver(index)}
                  onMouseOut={handleMouseOut}
                  onClick={(e) =>
                    !isDisabled && handlePolygonClick(square.id, e)
                  }
                />
              );
            })}
        </GoogleMap>
      )}
    </>
  );
};

export default React.memo(Map);

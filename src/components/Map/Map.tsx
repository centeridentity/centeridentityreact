import React, { useEffect } from 'react'
import { GoogleMap, GoogleMapProps, useJsApiLoader, useGoogleMap, Marker, Polygon } from '@react-google-maps/api';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';

const containerStyle = {
  width: '505px',
  height: '400px'
};

declare var window: any;

const Map = (props: any) => {
  const precision = props.precision || 4
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: props.googleApi
  })
  const [map, setMap]: [map: any, setMap: any] = React.useState(null)

  const onLoad = React.useCallback(function callback(map: any) {
    const bounds = new window.google.maps.LatLngBounds(props.center);
    map.fitBounds(bounds);
    setMap(map)
    map.addListener('click', (e: any) => {
      props.setSelectedLocation({lat: e.latLng.lat(), lng: e.latLng.lng()})
    })
  }, [])

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(null)
  }, [])

  const triggerInvokedFromParent = () => {
    console.log('TriggerInvokedFromParent');
    geocodeByAddress(props.place.label)
    .then((results: any) => getLatLng(results[0]))
    .then(({ lat, lng }: {lat: any, lng: any}) => {
      map && map.panTo({ lat, lng })
    });
  };

  useEffect(() => {
    triggerInvokedFromParent();
  }, [props.place]);

  let paths: any[] = []

  if(props.selectedLocation.lat && props.selectedLocation.lng) {
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) - 0.00005
    })
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) - 0.00005
    })
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) - 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) + 0.00005
    })
    paths.push({
      lat: parseFloat(props.selectedLocation.lat.toFixed(precision)) + 0.00005,
      lng: parseFloat(props.selectedLocation.lng.toFixed(precision)) + 0.00005
    })
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
    zIndex: 10
  }
  return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={props.center}
        zoom={6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        mapTypeId='satellite'
      >
        {props.selectedLocation.lat && props.selectedLocation.lng && <Marker
          position={{
            lat: parseFloat(props.selectedLocation.lat.toFixed(precision)),
            lng: parseFloat(props.selectedLocation.lng.toFixed(precision))
          }}
        ></Marker>}
        {props.selectedLocation.lat && props.selectedLocation.lng && <Polygon
          paths={paths}
          options={options}
        />}
      </GoogleMap>
  )
}

export default React.memo(Map)
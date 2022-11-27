import React, { useEffect } from 'react'
import { GoogleMap, GoogleMapProps, useJsApiLoader, useGoogleMap, Marker } from '@react-google-maps/api';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';

const containerStyle = {
  width: '505px',
  height: '400px'
};

const Map = (props: any) => {
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
    .then(results => getLatLng(results[0]))
    .then(({ lat, lng }) => {
      map && map.panTo({ lat, lng })
    });
  };

  useEffect(() => {
    triggerInvokedFromParent();
  }, [props.place]);

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
          position={props.selectedLocation}
        ></Marker>}
      </GoogleMap>
  )
}

export default React.memo(Map)
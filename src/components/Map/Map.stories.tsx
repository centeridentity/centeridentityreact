import React, { useState } from "react";
import Map, { MapProps } from "./Map";
import { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";

// Define the specific type for map style rules
type MapStyle = {
  featureType: string;
  elementType: string;
  stylers: { visibility: "on" | "off" }[];
};

const mapStyles: MapStyle[] = [
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
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

// Define the type for options to ensure TypeScript checks the validity of the properties
type MapOptions = {
  gestureHandling: string;
  streetViewControl: boolean;
  styles: MapStyle[];
};

const options: MapOptions = {
  gestureHandling: "greedy",
  streetViewControl: false, // This will remove the street view control button
  styles: mapStyles,
};

const Template: StoryFn<MapProps> = (args: MapProps) => {
  const [selectedLocation, setSelectedLocation] = useState(
    args.selectedLocation
  );

  const handleSetSelectedLocation = (location: {
    lat: number;
    lng: number;
  }) => {
    setSelectedLocation(location);
    action("setSelectedLocation")(location);
  };

  return (
    <Map
      {...args}
      setSelectedLocation={handleSetSelectedLocation}
      selectedLocation={selectedLocation}
      options={options}
    />
  );
};

export const Primary = Template.bind({});
Primary.args = {
  selectedLocation: { lat: 0, lng: 0 },
  place: { label: "Portland, Oregon" },
  setSelectedLocation: action("setSelectedLocation") as unknown as (location: {
    lat: number;
    lng: number;
  }) => void,
  center: { lat: 45, lng: 0 },
  zoom: 2.5,
  mapContainerStyle: {
    width: "100%",
    height: "100%",
  },
  mapTypeId: "hybrid",
  options: {},
  precision: 4,
  overlay: true,
  drawGrid: false,
};

export default {
  title: "Map",
  component: Map,
} as Meta<MapProps>;

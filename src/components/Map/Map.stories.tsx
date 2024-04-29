// Map.stories.tsx
import React, { useState } from "react";
import Map, { MapProps } from "./Map";
import { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";

export default {
  title: "Map",
  component: Map,
} as Meta;
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
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];
const options = {
  gestureHandling: "greedy",
  streetViewControl: false, // This will remove the street view control button
  styles: mapStyles,
  // ... other options ...
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
  setSelectedLocation: { lat: 45, lng: 1 },
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

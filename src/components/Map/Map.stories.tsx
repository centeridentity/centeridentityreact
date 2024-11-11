import React, { useState } from "react";
import Map, { MapProps } from "./Map";
import { StoryFn, Meta } from "@storybook/react";
import { action } from "@storybook/addon-actions";

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

  const handleonZoomWithGrid = () => {
    console.log("handleonZoomWithGrid");
  };

  const handleonZoomWithoutGrid = () => {
    console.log("handleonZoomWithoutGrid");
  };

  const handleonGridSquareClicked = () => {
    console.log("onGridSquareClicked");
  };

  return (
    <Map
      {...args}
      setSelectedLocation={handleSetSelectedLocation}
      selectedLocation={selectedLocation}
      onZoomWithGrid={handleonZoomWithGrid}
      onZoomWithoutGrid={handleonZoomWithoutGrid}
      onGridSquareClicked={handleonGridSquareClicked}
    />
  );
};

export const Primary = Template.bind({});
Primary.args = {
  selectedLocation: { lat: 0, lng: 0 },
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
  options: {},
  precision: 4,
  disabledLocations: [
    { lat: 45.52442537936001, lng: -122.68402134845269, radius: 500 },
  ],
};

export default {
  title: "Map",
  component: Map,
} as Meta<MapProps>;

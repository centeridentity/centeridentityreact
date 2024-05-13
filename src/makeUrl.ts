import { API_KEY, API_SERVER } from "./config";

export function makeApiUrl(path: string, extraQueryParams: string = "") {
  return `${API_SERVER}${path}?api_key=${API_KEY}&origin=${window.location.origin}&${extraQueryParams}`;
}
export function makeUrl(path: string, extraQueryParams: string = "") {
  return `${API_SERVER}${path}`;
}

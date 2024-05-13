import { makeUrl } from "./makeUrl";

export async function logEvent(name: string, props: any) {
  try {
    props["source"] = "map";
    props["$current_url"] = window.location.href;
    await fetch(makeUrl("/event"), {
      method: "POST",
      body: JSON.stringify({
        name: name,
        props: props,
      }),
      headers: {
        "Content-type": "application/json",
      },
    });
  } catch (err) {}
}

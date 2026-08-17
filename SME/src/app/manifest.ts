import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SME Buses — Shree Mateshwari Enterprises",
    short_name: "SME Buses",
    description:
      "Safe, comfortable and reliable bus rental transportation across India since 2005.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F1A33",
    theme_color: "#E8721A",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

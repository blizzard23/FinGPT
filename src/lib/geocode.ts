// Reverse geocoding: lat/lng -> a short, human place name. Pluggable and
// degrades gracefully (returns null on any failure or timeout) so a photo upload
// never blocks on the network.
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", "de");

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };

    return (
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.countryName ||
      null
    );
  } catch {
    return null;
  }
}

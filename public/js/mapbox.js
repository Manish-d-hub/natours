/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2VjdXJlIiwiYSI6ImNrenNlNDg1MDRiZTMycW5ybXpvbnk3YXkifQ.aBdlCKyePIpVq6j2zJSdmg';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/secure/ckzwapc5n005a14ng5r0qk1pz',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 7, // lng, lat
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 150,
      botton: 100,
      left: 100,
      right: 100,
    },
  });
};

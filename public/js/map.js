console.log("listing:", listing);
console.log(listing);
const lat = listing.geometry.coordinates[1];
const lng = listing.geometry.coordinates[0];

const map = L.map('map').setView([lat, lng], 9);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


let marker = L.marker([lat, lng], { color: 'red', }).addTo(map)

var circle = L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);



var popup = L.popup()
    .setLatLng([lat, lng])
    .setContent("Exact location provided after booking.")
    .openOn(map);
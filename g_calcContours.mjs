import fs from 'fs'
import calcContours from './src/calcContours.mjs'


let opt
let pgs

let points = [
    [24.325, 120.786, 0], [23.944, 120.968, 10], [24.884, 121.234, 20], [24.579, 121.345, 80], [24.664, 121.761, 40], [23.803, 121.397, 30],
    [23.727, 120.772, 0], [23.539, 120.975, 0], [23.612, 121.434, 0],
    [23.193, 120.355, 22], [23.456, 120.890, 42], [23.280, 120.551, 25], [23.162, 121.247, 5],
]

let containInner = [ //此結構代表1個polygon, leaflet可支援顯示, 但turf做intersect不支援, 故l-contour會通過toMultiPolygon轉換才能支援
    [
        [24.28, 120.842], [24.494, 121.203], [24.314, 121.190], [24.232, 121.109], [24.249, 120.910],
    ],
    [
        [24.217, 120.851], [24.172, 121.242], [24.059, 121.333], [24.001, 121.055],
    ],
]

let clipInner = [ //此結構代表1個polygon, leaflet可支援顯示, 但turf做difference不支援, 故l-contour會通過toMultiPolygon轉換才能支援
    [
        [24.28, 120.842], [24.494, 121.203], [24.314, 121.190], [24.232, 121.109], [24.249, 120.910],
    ],
    [
        [24.217, 120.851], [24.172, 121.242], [24.059, 121.333], [24.001, 121.055],
    ],
]

let clipOuter = [
    [24.585, 120.79], [24.9, 121.620], [23.984, 121.6], [23.941, 121.196], [24.585, 120.79]
]

let thresholds = [0, 5, 10, 20, 30, 40, 55, 70, 85]

opt = {
    containInner,
    // clipInner,
    // clipOuter,
    // thresholds,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours1.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => [
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 8816415983.520641,
//     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
//     range: { text: '0 - 10', low: 0, up: 10 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array], [Array] ],
//     effectArea: 6313849792.51668,
//     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
//     range: { text: '10 - 20', low: 10, up: 20 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 4644527033.145393,
//     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
//     range: { text: '20 - 30', low: 20, up: 30 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 3211476473.817216,
//     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
//     range: { text: '30 - 40', low: 30, up: 40 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 2077979122.6009896,
//     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
//     range: { text: '40 - 50', low: 40, up: 50 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 1165016840.7246127,
//     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
//     range: { text: '50 - 60', low: 50, up: 60 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   }
// ]

opt = {
    // containInner,
    clipInner,
    // clipOuter,
    // thresholds,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours2.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => [
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 8816415983.520641,
//     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
//     range: { text: '0 - 10', low: 0, up: 10 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array], [Array], [Array] ],
//     effectArea: 6313849792.51668,
//     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
//     range: { text: '10 - 20', low: 10, up: 20 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array], [Array], [Array], [Array] ],
//     effectArea: 4644527033.145393,
//     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
//     range: { text: '20 - 30', low: 20, up: 30 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array], [Array], [Array] ],
//     effectArea: 3211476473.817216,
//     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
//     range: { text: '30 - 40', low: 30, up: 40 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 2077979122.6009896,
//     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
//     range: { text: '40 - 50', low: 40, up: 50 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 1165016840.7246127,
//     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
//     range: { text: '50 - 60', low: 50, up: 60 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 517569529.67260885,
//     effectAreaCentroid: [ 24.49676761904762, 121.33386714285714 ],
//     range: { text: '60 - 70', low: 60, up: 70 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: 'top',
//     latLngs: [ [Array] ],
//     effectArea: 129338350.80859056,
//     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
//     range: { text: '70 - 80', low: 70, up: 80 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   }
// ]

opt = {
    // containInner,
    // clipInner,
    clipOuter,
    // thresholds,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours3.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => [
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 8816415983.520641,
//     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
//     range: { text: '0 - 10', low: 0, up: 10 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 6313849792.51668,
//     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
//     range: { text: '10 - 20', low: 10, up: 20 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array], [Array], [Array] ],
//     effectArea: 4644527033.145393,
//     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
//     range: { text: '20 - 30', low: 20, up: 30 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array], [Array] ],
//     effectArea: 3211476473.817216,
//     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
//     range: { text: '30 - 40', low: 30, up: 40 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 2077979122.6009896,
//     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
//     range: { text: '40 - 50', low: 40, up: 50 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 1165016840.7246127,
//     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
//     range: { text: '50 - 60', low: 50, up: 60 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 517569529.67260885,
//     effectAreaCentroid: [ 24.49676761904762, 121.33386714285714 ],
//     range: { text: '60 - 70', low: 60, up: 70 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: 'top',
//     latLngs: [ [Array] ],
//     effectArea: 129338350.80859056,
//     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
//     range: { text: '70 - 80', low: 70, up: 80 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   }
// ]

opt = {
    // containInner,
    // clipInner,
    // clipOuter,
    thresholds,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours4.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => [
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 8816415983.520641,
//     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
//     range: { text: '0 - 5', low: 0, up: 5 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 7186533231.875366,
//     effectAreaCentroid: [ 23.802593637502845, 121.01686739291412 ],
//     range: { text: '5 - 10', low: 5, up: 10 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 6313849792.51668,
//     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
//     range: { text: '10 - 20', low: 10, up: 20 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 4644527033.145393,
//     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
//     range: { text: '20 - 30', low: 20, up: 30 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 3211476473.817216,
//     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
//     range: { text: '30 - 40', low: 30, up: 40 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 2077979122.6009896,
//     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
//     range: { text: '40 - 55', low: 40, up: 55 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 808871008.3417139,
//     effectAreaCentroid: [ 24.476209523809523, 121.33108392857142 ],
//     range: { text: '55 - 70', low: 55, up: 70 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   },
//   {
//     sepZone: 'top',
//     latLngs: [ [Array] ],
//     effectArea: 129338350.80859056,
//     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
//     range: { text: '70 - 85', low: 70, up: 85 },
//     center: [ 23.973333333333333, 121.13616666666665 ]
//   }
// ]

opt = {
    withStyle: true,
    // returnGeojson: true,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours5.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => [
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 8816415983.520641,
//     effectAreaCentroid: [ 23.973333333333333, 121.13616666666665 ],
//     range: { text: '0 - 10', low: 0, up: 10 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(255, 255, 255, 1)',
//       weight: 1,
//       fillColor: 'rgba(255, 255, 255, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(255, 255, 255, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(255, 255, 255, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 6313849792.51668,
//     effectAreaCentroid: [ 23.80531082115246, 121.00212446033244 ],
//     range: { text: '10 - 20', low: 10, up: 20 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(254, 200, 127, 1)',
//       weight: 1,
//       fillColor: 'rgba(254, 200, 127, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(254, 200, 127, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(254, 200, 127, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 4644527033.145393,
//     effectAreaCentroid: [ 23.791076270349798, 120.96719391394832 ],
//     range: { text: '20 - 30', low: 20, up: 30 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(253, 135, 61, 1)',
//       weight: 1,
//       fillColor: 'rgba(253, 135, 61, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(253, 135, 61, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(253, 135, 61, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 3211476473.817216,
//     effectAreaCentroid: [ 24.025569342289934, 121.2215115677248 ],
//     range: { text: '30 - 40', low: 30, up: 40 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(247, 75, 41, 1)',
//       weight: 1,
//       fillColor: 'rgba(247, 75, 41, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(247, 75, 41, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(247, 75, 41, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array], [Array] ],
//     effectArea: 2077979122.6009896,
//     effectAreaCentroid: [ 24.155744629924033, 121.28620957869633 ],
//     range: { text: '40 - 50', low: 40, up: 50 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(225, 61, 39, 1)',
//       weight: 1,
//       fillColor: 'rgba(225, 61, 39, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(225, 61, 39, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(225, 61, 39, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 1165016840.7246127,
//     effectAreaCentroid: [ 24.45565142857143, 121.3283007142857 ],
//     range: { text: '50 - 60', low: 50, up: 60 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(209, 48, 29, 1)',
//       weight: 1,
//       fillColor: 'rgba(209, 48, 29, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(209, 48, 29, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(209, 48, 29, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: '',
//     latLngs: [ [Array] ],
//     effectArea: 517569529.67260885,
//     effectAreaCentroid: [ 24.49676761904762, 121.33386714285714 ],
//     range: { text: '60 - 70', low: 60, up: 70 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(194, 37, 34, 1)',
//       weight: 1,
//       fillColor: 'rgba(194, 37, 34, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(194, 37, 34, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(194, 37, 34, 1)',
//       'fill-opacity': 0.2
//     }
//   },
//   {
//     sepZone: 'top',
//     latLngs: [ [Array] ],
//     effectArea: 129338350.80859056,
//     effectAreaCentroid: [ 24.537883809523812, 121.33943357142857 ],
//     range: { text: '70 - 80', low: 70, up: 80 },
//     center: [ 23.973333333333333, 121.13616666666665 ],
//     style: {
//       color: 'rgba(180, 30, 60, 1)',
//       weight: 1,
//       fillColor: 'rgba(180, 30, 60, 1)',
//       fillOpacity: 0.2,
//       stroke: 'rgba(180, 30, 60, 1)',
//       'stroke-width': 1,
//       'stroke-opacity': 1,
//       fill: 'rgba(180, 30, 60, 1)',
//       'fill-opacity': 0.2
//     }
//   }
// ]

opt = {
    withStyle: true,
    returnGeojson: true,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours6.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => {
//   type: 'FeatureCollection',
//   features: [
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] }
//   ]
// }

opt = {
    withStyle: true,
    returnGeojson: true,
    inverseCoordinate: true,
}
pgs = calcContours(points, opt)
fs.writeFileSync('./calcContours7.json', JSON.stringify(pgs), 'utf8')
console.log(pgs)
// => {
//   type: 'FeatureCollection',
//   features: [
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] },
//     { type: 'Feature', properties: [Object], geometry: [Object] }
//   ]
// }


//node --experimental-modules g_calcContours.mjs

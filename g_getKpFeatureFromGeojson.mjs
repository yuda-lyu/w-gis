import getKpFeatureFromGeojson from './src/getKpFeatureFromGeojson.mjs'


let geojson
let kp

geojson = `
{
    'type': 'FeatureCollection',
    'name': 'pgs',
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'name': 'pgs1',
            },
            'geometry': {
                'type': 'MultiPolygon',
                'coordinates': [
                    [
                        [
                            [0, 0],
                            [0, 1],
                            [1, 1],
                            [1, 0],
                            [0, 0],
                        ]
                    ]
                ]
            }
        },
        {
            'type': 'Feature',
            'properties': {
                'name': 'pgs2',
            },
            'geometry': {
                'type': 'MultiPolygon',
                'coordinates': [
                    [
                        [
                            [1, 1],
                            [1, 2],
                            [2, 2],
                            [2, 1],
                            [1, 1],
                        ]
                    ]
                ]
            }
        },
    ]
}
`

kp = getKpFeatureFromGeojson(geojson, { keysPick: 'properties.name' })
console.log(kp)
// => {
//   pgs1: {
//     type: 'Feature',
//     properties: { name: 'pgs1' },
//     geometry: { type: 'MultiPolygon', coordinates: [Array] }
//   },
//   pgs2: {
//     type: 'Feature',
//     properties: { name: 'pgs2' },
//     geometry: { type: 'MultiPolygon', coordinates: [Array] }
//   }
// }


//node g_getKpFeatureFromGeojson.mjs

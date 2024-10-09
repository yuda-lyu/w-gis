
import turf from './src/importTurf.mjs'
import getBoxFromGeojson from './src/getBoxFromGeojson.mjs'


let geojson = {
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
let r

r = getBoxFromGeojson(geojson)
console.log(r)

//node --experimental-modules g.mjs

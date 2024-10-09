
import getBoxFromGeojson from './src/getBoxFromGeojson.mjs'


let geojson
let r

geojson = {
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
r = getBoxFromGeojson(geojson)
console.log(r)
// => { xmin: 0, xmax: 2, ymin: 0, ymax: 2 }

geojson = {
    'type': 'Feature',
    'properties': {},
    'geometry': {
        'type': 'MultiPolygon',
        'coordinates': {
            'type': 'Feature',
            'properties': {
                'name': 'pgs',
            },
            'geometry': {
                'type': 'MultiPolygon',
                'coordinates': [
                    [
                        [
                            [0, 0],
                            [-0.2, 1],
                            [1, 1.1],
                            [1, 0],
                            [0, 0],
                        ]
                    ]
                ]
            }
        }
    }
}
r = getBoxFromGeojson(geojson)
console.log(r)
// => { xmin: -0.2, xmax: 1, ymin: 0, ymax: 1.1 }

//node --experimental-modules g.mjs

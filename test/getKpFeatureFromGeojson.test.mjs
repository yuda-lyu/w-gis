import assert from 'assert'
import getKpFeatureFromGeojson from '../src/getKpFeatureFromGeojson.mjs'


describe(`getKpFeatureFromGeojson`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        geojson: `
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
`,
        opt: { keysPick: 'properties.name' },
    }
    out[k] = {
        pgs1: {
            type: 'Feature',
            properties: {
                name: 'pgs1',
            },
            geometry: {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [0, 0],
                            [0, 1],
                            [1, 1],
                            [1, 0],
                            [0, 0],
                        ],
                    ],
                ],
            },
        },
        pgs2: {
            type: 'Feature',
            properties: {
                name: 'pgs2',
            },
            geometry: {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [1, 1],
                            [1, 2],
                            [2, 2],
                            [2, 1],
                            [1, 1],
                        ],
                    ],
                ],
            },
        },
    }
    it(`should pick features by name when getKpFeatureFromGeojson(geojson string)`, function() {
        k = 0
        let r = getKpFeatureFromGeojson(oin[k].geojson, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

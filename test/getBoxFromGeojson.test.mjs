import assert from 'assert'
import getBoxFromGeojson from '../src/getBoxFromGeojson.mjs'


describe(`getBoxFromGeojson`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        geojson: {
            type: 'FeatureCollection',
            name: 'pgs',
            features: [
                {
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
                {
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
            ],
        },
        opt: {},
    }
    out[k] = { xmin: 0, ymin: 0, xmax: 2, ymax: 2 }
    it(`should return box when getBoxFromGeojson(featureCollection)`, function() {
        k = 0
        let r = getBoxFromGeojson(oin[k].geojson, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geojson: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiPolygon',
                coordinates: {
                    type: 'Feature',
                    properties: {
                        name: 'pgs',
                    },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [0, 0],
                                    [-0.2, 1],
                                    [1, 1.1],
                                    [1, 0],
                                    [0, 0],
                                ],
                            ],
                        ],
                    },
                },
            },
        },
        opt: {},
    }
    out[k] = { xmin: -0.2, ymin: 0, xmax: 1, ymax: 1.1 }
    it(`should return box when getBoxFromGeojson(feature with nested coordinates feature)`, function() {
        k = 1
        let r = getBoxFromGeojson(oin[k].geojson, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

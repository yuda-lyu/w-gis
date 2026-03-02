import assert from 'assert'
import distilMultiPolygon from '../src/distilMultiPolygon.mjs'


describe(`distilMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = null
    out[k] = []
    it(`should return [] when distilMultiPolygon(null)`, function() {
        k = 0
        let r = distilMultiPolygon(oin[k])
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geometry: {
            type: 'Polygon',
            coordinates: [
                [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
            ],
        },
    }
    out[k] = [
        [
            [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
        ],
    ]
    it(`should return wrapped MultiPolygon when distilMultiPolygon(type='Polygon')`, function() {
        k = 1
        let r = distilMultiPolygon(oin[k])
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geometry: {
            type: 'MultiPolygon',
            coordinates: [
                [
                    [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
                ],
                [
                    [[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]],
                ],
            ],
        },
    }
    out[k] = [
        [
            [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
        ],
        [
            [[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]],
        ],
    ]
    it(`should return MultiPolygon coordinates when distilMultiPolygon(type='MultiPolygon')`, function() {
        k = 2
        let r = distilMultiPolygon(oin[k])
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geometry: {
            type: 'GeometryCollection',
            geometries: [
                { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] },
                { type: 'MultiPolygon', coordinates: [[[[10, 0], [11, 0], [11, 1], [10, 1], [10, 0]]]] },
            ],
        },
    }
    out[k] = [
        [
            [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]],
        ],
        [
            [[10, 0], [11, 0], [11, 1], [10, 1], [10, 0]],
        ],
    ]
    it(`should return parsed MultiPolygon list when distilMultiPolygon(type='GeometryCollection')`, function() {
        k = 3
        let r = distilMultiPolygon(oin[k])
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        geometry: {
            type: 'LineString',
            coordinates: [[0, 0], [1, 1]],
        },
    }
    out[k] = []
    it(`should return [] when distilMultiPolygon(type is not polygon geometry)`, function() {
        k = 4
        let r = distilMultiPolygon(oin[k])
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

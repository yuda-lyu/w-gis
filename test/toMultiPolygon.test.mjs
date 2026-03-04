import assert from 'assert'
import toMultiPolygon from '../src/toMultiPolygon.mjs'


describe(`toMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        rs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]]
    it(`should convert closed ringString when toMultiPolygon(ringString)`, function() {
        k = 0
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [[0, 0], [100, 0], [100, 1], [0, 1]],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1]]]]
    it(`should convert open ringString when toMultiPolygon(ringString)`, function() {
        k = 1
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1]]]]
    it(`should convert single polygon when toMultiPolygon(polygon)`, function() {
        k = 2
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[[0, 0], [10, 0], [10, 1], [0, 1]]]]
    it(`should convert polygon width=10 when toMultiPolygon(polygon)`, function() {
        k = 3
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1]]], [[[0, 0], [10, 0], [10, 1], [0, 1]]]]
    it(`should split polygons by default when toMultiPolygon(two polygons)`, function() {
        k = 4
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: { supposeType: 'ringStrings' },
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1]], [[0, 0], [10, 0], [10, 1], [0, 1]]]]
    it(`should keep rings in one polygon when toMultiPolygon(supposeType='ringStrings')`, function() {
        k = 5
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [[
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1]], [[0, 0], [10, 0], [10, 1], [0, 1]]]]
    it(`should keep multiPolygon when toMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = toMultiPolygon(oin[k].rs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

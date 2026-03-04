import assert from 'assert'
import getAreaMultiPolygon from '../src/getAreaMultiPolygon.mjs'


describe(`getAreaMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        opt: {},
    }
    out[k] = 100
    it(`should return area when getAreaMultiPolygon(closed ringString)`, function() {
        k = 0
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
        opt: {},
    }
    out[k] = 100
    it(`should return same area when getAreaMultiPolygon(open ringString)`, function() {
        k = 1
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = 100
    it(`should return area when getAreaMultiPolygon(single polygon)`, function() {
        k = 2
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = 10
    it(`should return area when getAreaMultiPolygon(polygon width=10)`, function() {
        k = 3
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = 110
    it(`should sum polygons when getAreaMultiPolygon(two polygons default supposeType)`, function() {
        k = 4
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: { supposeType: 'ringStrings' },
    }
    out[k] = 90
    it(`should subtract hole when getAreaMultiPolygon(two ringStrings)`, function() {
        k = 5
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ]],
        opt: {},
    }
    out[k] = 90
    it(`should return area when getAreaMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = getAreaMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

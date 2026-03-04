import assert from 'assert'
import getAreaMultiPolygonSm from '../src/getAreaMultiPolygonSm.mjs'


describe(`getAreaMultiPolygonSm`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[121, 23], [122, 23], [122, 24], [121, 24], [121, 23]],
        opt: {},
    }
    out[k] = 11338704025.00093
    it(`should return area when getAreaMultiPolygonSm(closed ringString)`, function() {
        k = 0
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[121, 23], [122, 23], [122, 24], [121, 24]],
        opt: {},
    }
    out[k] = 11338704025.00093
    it(`should return same area when getAreaMultiPolygonSm(open ringString)`, function() {
        k = 1
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[121, 23], [122, 23], [122, 24], [121, 24]],
        ],
        opt: {},
    }
    out[k] = 11338704025.00093
    it(`should return area when getAreaMultiPolygonSm(single polygon)`, function() {
        k = 2
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[121, 23], [121.5, 23], [121.5, 24], [121, 24]],
        ],
        opt: {},
    }
    out[k] = 5669352012.500465
    it(`should return area when getAreaMultiPolygonSm(polygon width=0.5)`, function() {
        k = 3
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[121, 23], [122, 23], [122, 24], [121, 24]],
            [[121, 23], [121.5, 23], [121.5, 24], [121, 24]],
        ],
        opt: {},
    }
    out[k] = 17008056037.501396
    it(`should sum polygons when getAreaMultiPolygonSm(two polygons default supposeType)`, function() {
        k = 4
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[121, 23], [122, 23], [122, 24], [121, 24]],
            [[121, 23], [121.5, 23], [121.5, 24], [121, 24]],
        ],
        opt: { supposeType: 'ringStrings' },
    }
    out[k] = 5669352012.500465
    it(`should use ringStrings mode when getAreaMultiPolygonSm(two ringStrings)`, function() {
        k = 5
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[121, 23], [122, 23], [122, 24], [121, 24]],
            [[121, 23], [121.5, 23], [121.5, 24], [121, 24]],
        ]],
        opt: {},
    }
    out[k] = 5669352012.500465
    it(`should return area when getAreaMultiPolygonSm(multiPolygon)`, function() {
        k = 6
        let r = getAreaMultiPolygonSm(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

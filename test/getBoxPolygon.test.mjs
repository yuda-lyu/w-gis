import assert from 'assert'
import getBoxPolygon from '../src/getBoxPolygon.mjs'


describe(`getBoxPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
    }
    out[k] = [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]
    it(`should return box polygon when getBoxPolygon(closed ringString)`, function() {
        k = 0
        let r = getBoxPolygon(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
    }
    out[k] = [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]
    it(`should return same box polygon when getBoxPolygon(open ringString)`, function() {
        k = 1
        let r = getBoxPolygon(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
    }
    out[k] = [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]
    it(`should return box polygon when getBoxPolygon(single polygon)`, function() {
        k = 2
        let r = getBoxPolygon(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = [[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]
    it(`should return box polygon when getBoxPolygon(polygon width=10)`, function() {
        k = 3
        let r = getBoxPolygon(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]
    it(`should return box polygon when getBoxPolygon(two polygons)`, function() {
        k = 4
        let r = getBoxPolygon(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [100, 0], [100, 1], [0, 1]],
            [[0, 0], [10, 0], [10, 1], [0, 1]],
            [[0, 0], [-10, 0], [-10, 123], [0, 1]],
        ]],
    }
    out[k] = [[-10, 0], [100, 0], [100, 123], [-10, 123], [-10, 0]]
    it(`should return box polygon when getBoxPolygon(multiPolygon)`, function() {
        k = 5
        let r = getBoxPolygon(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

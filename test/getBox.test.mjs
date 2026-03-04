import assert from 'assert'
import getBox from '../src/getBox.mjs'


describe(`getBox`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
    }
    out[k] = { xmin: 0, ymin: 0, xmax: 100, ymax: 1 }
    it(`should return box when getBox(closed ringString)`, function() {
        k = 0
        let r = getBox(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
    }
    out[k] = { xmin: 0, ymin: 0, xmax: 100, ymax: 1 }
    it(`should return same box when getBox(open ringString)`, function() {
        k = 1
        let r = getBox(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
    }
    out[k] = { xmin: 0, ymin: 0, xmax: 100, ymax: 1 }
    it(`should return box when getBox(single polygon)`, function() {
        k = 2
        let r = getBox(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
    }
    out[k] = { xmin: 0, ymin: 0, xmax: 10, ymax: 1 }
    it(`should return box when getBox(polygon width=10)`, function() {
        k = 3
        let r = getBox(oin[k].pgs)
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
    out[k] = { xmin: 0, ymin: 0, xmax: 100, ymax: 1 }
    it(`should return box when getBox(two polygons)`, function() {
        k = 4
        let r = getBox(oin[k].pgs)
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
    out[k] = { xmin: -10, ymin: 0, xmax: 100, ymax: 123 }
    it(`should return box when getBox(multiPolygon)`, function() {
        k = 5
        let r = getBox(oin[k].pgs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

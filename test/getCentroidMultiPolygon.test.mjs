import assert from 'assert'
import getCentroidMultiPolygon from '../src/getCentroidMultiPolygon.mjs'


describe(`getCentroidMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        opt: {},
    }
    out[k] = [50, 0.5]
    it(`should return centroid when getCentroidMultiPolygon(closed ringString)`, function() {
        k = 0
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
        opt: {},
    }
    out[k] = [50, 0.5]
    it(`should return same centroid when getCentroidMultiPolygon(open ringString)`, function() {
        k = 1
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [50, 0.5]
    it(`should return centroid when getCentroidMultiPolygon(single polygon)`, function() {
        k = 2
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [5, 0.5]
    it(`should return centroid when getCentroidMultiPolygon(polygon width=10)`, function() {
        k = 3
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [27.5, 0.5]
    it(`should return centroid when getCentroidMultiPolygon(two polygons default supposeType)`, function() {
        k = 4
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [27.5, 0.5]
    it(`should return centroid when getCentroidMultiPolygon(two ringStrings)`, function() {
        k = 5
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [27.5, 0.5]
    it(`should return centroid when getCentroidMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = getCentroidMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

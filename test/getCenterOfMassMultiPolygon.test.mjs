import assert from 'assert'
import getCenterOfMassMultiPolygon from '../src/getCenterOfMassMultiPolygon.mjs'


describe(`getCenterOfMassMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        opt: {},
    }
    out[k] = [50, 0.5]
    it(`should return center when getCenterOfMassMultiPolygon(closed ringString)`, function() {
        k = 0
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
        opt: {},
    }
    out[k] = [50, 0.5]
    it(`should return same center when getCenterOfMassMultiPolygon(open ringString)`, function() {
        k = 1
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
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
    it(`should return center when getCenterOfMassMultiPolygon(single polygon)`, function() {
        k = 2
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
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
    it(`should return center when getCenterOfMassMultiPolygon(polygon width=10)`, function() {
        k = 3
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [50, 0.5]
    it(`should return center when getCenterOfMassMultiPolygon(two polygons default supposeType)`, function() {
        k = 4
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [50, 0.5]
    it(`should return center when getCenterOfMassMultiPolygon(two ringStrings)`, function() {
        k = 5
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [50, 0.5]
    it(`should return center when getCenterOfMassMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = getCenterOfMassMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

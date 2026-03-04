import assert from 'assert'
import isPointInPolygons from '../src/isPointInPolygons.mjs'


describe(`isPointInPolygons`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        p: [0.5, 0.5],
        pgs: [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
        ],
        opt: {},
    }
    out[k] = true
    it(`should return true when isPointInPolygons(point inside polygon)`, function() {
        k = 0
        let r = isPointInPolygons(oin[k].p, oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [1.5, 0.5],
        pgs: [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
        ],
        opt: {},
    }
    out[k] = false
    it(`should return false when isPointInPolygons(point outside polygon)`, function() {
        k = 1
        let r = isPointInPolygons(oin[k].p, oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

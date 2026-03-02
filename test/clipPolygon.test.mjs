import assert from 'assert'
import clipPolygon from '../src/clipPolygon.mjs'


describe(`clipPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    // ----------------
    // invalid inputs
    // ----------------

    k++
    oin[k] = {
        pgs1: 'not array',
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]],
        opt: {},
    }
    out[k] = null
    it(`should return null when clipPolygon(pgs1, pgs2, opt) with pgs1 not array`, function() {
        k = 0
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],
        pgs2: 'not array',
        opt: {},
    }
    out[k] = null
    it(`should return null when clipPolygon(pgs1, pgs2, opt) with pgs2 not array`, function() {
        k = 1
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strictEqual(r, rr)
    })

    // ----------------
    // basic difference
    // ----------------

    k++
    oin[k] = {
        // 以 ringString(depth=1) 輸入，函數內會轉為 Polygon
        pgs1: [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
        pgs2: [[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]],
        opt: {},
    }
    out[k] = [
        [[2, 4], [2, 0], [0, 0], [0, 4]],
    ]
    it(`should return expected Polygon when clipPolygon(ringString - ringString)`, function() {
        k = 2
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
        pgs2: [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]],
        opt: { epsilon: 0.00000001 },
    }
    out[k] = [
        [[2, 2], [2, 0], [0, 0], [0, 2]],
    ]
    it(`should return original Polygon when clipPolygon(no overlap + custom epsilon)`, function() {
        k = 3
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

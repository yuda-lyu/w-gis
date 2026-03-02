import assert from 'assert'
import clipMultiPolygon from '../src/clipMultiPolygon.mjs'


describe(`clipMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    // ----------------
    // invalid inputs
    // ----------------

    k++
    oin[k] = {
        pgs1: 'not array',
        pgs2: [[[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]],
        opt: {},
    }
    out[k] = null
    it(`should return null when clipMultiPolygon(pgs1, pgs2, opt) with pgs1 not array`, function() {
        k = 0
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]],
        pgs2: 'not array',
        opt: {},
    }
    out[k] = null
    it(`should return null when clipMultiPolygon(pgs1, pgs2, opt) with pgs2 not array`, function() {
        k = 1
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strictEqual(r, rr)
    })

    // ----------------
    // basic difference
    // ----------------

    k++
    oin[k] = {
        // 以 polygon(depth=2) 輸入，函數內會轉為 MultiPolygon
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]],
        opt: {},
    }
    out[k] = [
        [
            [[0, 0], [2, 0], [2, 4], [0, 4], [0, 0]],
        ],
    ]
    it(`should return expected MultiPolygon when clipMultiPolygon(polygon - polygon)`, function() {
        k = 2
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]],
        pgs2: [[[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]]],
        opt: {},
    }
    out[k] = [
        [
            [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
        ],
    ]
    it(`should return original MultiPolygon when clipMultiPolygon(no overlap)`, function() {
        k = 3
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

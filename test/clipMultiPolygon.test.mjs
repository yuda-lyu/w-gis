import assert from 'assert'
import clipMultiPolygon from '../src/clipMultiPolygon.mjs'


describe(`clipMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs1: 'not array',
        pgs2: [[[[2, 0], [4, 0], [4, 4], [2, 4]]]],
        opt: {},
    }
    out[k] = { err: /no pgs1/ }
    it(`should throw error when clipMultiPolygon(pgs1 not array)`, function() {
        k = 0
        assert.throws(() => {
            clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: 'not array',
        opt: {},
    }
    out[k] = { err: /invalid pgs2/ }
    it(`should throw error when clipMultiPolygon(pgs2 not array)`, function() {
        k = 1
        assert.throws(() => {
            clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [1, 0], [1, 1], [0, 1]]]],
        pgs2: [],
        opt: {},
    }
    out[k] = [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]]
    it(`should return pgs1 when clipMultiPolygon(pgs2 empty)`, function() {
        k = 2
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [2, 0], [2, 4], [0, 4], [0, 0]]]]
    it(`should clip polygon case1 when clipMultiPolygon(polygon)`, function() {
        k = 3
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 0], [2, 2], [0, 2]]],
        opt: {},
    }
    out[k] = [[[[0, 2], [2, 2], [2, 0], [4, 0], [4, 4], [0, 4], [0, 2]]]]
    it(`should clip polygon case2 when clipMultiPolygon(polygon)`, function() {
        k = 4
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 2], [0, 4]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [2, 2], [0, 0]]]]
    it(`should clip polygon case3 when clipMultiPolygon(polygon)`, function() {
        k = 5
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[2, 0], [4, 0], [4, 4], [2, 4]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [2, 0], [2, 4], [0, 4], [0, 0]]]]
    it(`should clip multiPolygon case1 when clipMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[0, 0], [2, 0], [2, 2], [0, 2]]]],
        opt: {},
    }
    out[k] = [[[[0, 2], [2, 2], [2, 0], [4, 0], [4, 4], [0, 4], [0, 2]]]]
    it(`should clip multiPolygon case2 when clipMultiPolygon(multiPolygon)`, function() {
        k = 7
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[0, 0], [2, 2], [0, 4]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [2, 2], [0, 0]]]]
    it(`should clip multiPolygon case3 when clipMultiPolygon(multiPolygon)`, function() {
        k = 8
        let r = clipMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

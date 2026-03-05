import assert from 'assert'
import clipPolygon from '../src/clipPolygon.mjs'


describe(`clipPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs1: 'not array',
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4]]],
        opt: {},
    }
    out[k] = { err: /no pgs1/ }
    it(`should throw error when clipPolygon(pgs1 not array)`, function() {
        k = 0
        assert.throws(() => {
            clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: 'not array',
        opt: {},
    }
    out[k] = { err: /invalid pgs2/ }
    it(`should throw error when clipPolygon(pgs2 not array)`, function() {
        k = 1
        assert.throws(() => {
            clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [1, 0], [1, 1], [0, 1]]],
        pgs2: [],
        opt: {},
    }
    out[k] = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    it(`should return pgs1 when clipPolygon(pgs2 empty)`, function() {
        k = 2
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4]]],
        opt: {},
    }
    out[k] = [[[2, 4], [2, 0], [0, 0], [0, 4], [2, 4]]]
    it(`should clip polygon case1 when clipPolygon(polygon)`, function() {
        k = 3
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 0], [2, 2], [0, 2]]],
        opt: {},
    }
    out[k] = [[[4, 4], [4, 0], [2, 0], [2, 2], [0, 2], [0, 4], [4, 4]]]
    it(`should clip polygon case2 when clipPolygon(polygon)`, function() {
        k = 4
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 2], [0, 4]]],
        opt: {},
    }
    out[k] = [[[4, 4], [4, 0], [0, 0], [2, 2], [0, 4], [4, 4]]]
    it(`should clip polygon case3 when clipPolygon(polygon)`, function() {
        k = 5
        let r = clipPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

import assert from 'assert'
import intersectMultiPolygon from '../src/intersectMultiPolygon.mjs'


describe(`intersectMultiPolygon`, function() {
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
    it(`should throw error when intersectMultiPolygon(pgs1 not array)`, function() {
        k = 0
        assert.throws(() => {
            intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: 'not array',
        opt: {},
    }
    out[k] = { err: /invalid pgs2/ }
    it(`should throw error when intersectMultiPolygon(pgs2 not array)`, function() {
        k = 1
        assert.throws(() => {
            intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [1, 0], [1, 1], [0, 1]]]],
        pgs2: [],
        opt: {},
    }
    out[k] = [[[[0, 0], [1, 0], [1, 1], [0, 1]]]]
    it(`should return pgs1 when intersectMultiPolygon(pgs2 empty)`, function() {
        k = 2
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4]]],
        opt: {},
    }
    out[k] = [[[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]]
    it(`should intersect polygon case1 when intersectMultiPolygon(polygon)`, function() {
        k = 3
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 0], [2, 2], [0, 2]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]]
    it(`should intersect polygon case2 when intersectMultiPolygon(polygon)`, function() {
        k = 4
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 2], [0, 4]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [2, 2], [0, 4], [0, 0]]]]
    it(`should intersect polygon case3 when intersectMultiPolygon(polygon)`, function() {
        k = 5
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[-1, 0], [2, 1], [-1, 4]]],
        opt: {},
    }
    out[k] = [[[[0, 0.3333333333333333], [2, 1], [0, 3], [0, 0.3333333333333333]]]]
    it(`should intersect polygon case4 when intersectMultiPolygon(polygon)`, function() {
        k = 6
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[2, 0], [4, 0], [4, 4], [2, 4]]]],
        opt: {},
    }
    out[k] = [[[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]]
    it(`should intersect multiPolygon case1 when intersectMultiPolygon(multiPolygon)`, function() {
        k = 7
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[0, 0], [2, 0], [2, 2], [0, 2]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]]
    it(`should intersect multiPolygon case2 when intersectMultiPolygon(multiPolygon)`, function() {
        k = 8
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[0, 0], [2, 2], [0, 4]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [2, 2], [0, 4], [0, 0]]]]
    it(`should intersect multiPolygon case3 when intersectMultiPolygon(multiPolygon)`, function() {
        k = 9
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[-1, 0], [2, 1], [-1, 4]]]],
        opt: {},
    }
    out[k] = [[[[0, 0.3333333333333333], [2, 1], [0, 3], [0, 0.3333333333333333]]]]
    it(`should intersect multiPolygon case4 when intersectMultiPolygon(multiPolygon)`, function() {
        k = 10
        let r = intersectMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

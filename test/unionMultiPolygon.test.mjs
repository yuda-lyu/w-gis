import assert from 'assert'
import unionMultiPolygon from '../src/unionMultiPolygon.mjs'


describe(`unionMultiPolygon`, function() {
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
    it(`should throw error when unionMultiPolygon(pgs1 not array)`, function() {
        k = 0
        assert.throws(() => {
            unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: 'not array',
        opt: {},
    }
    out[k] = { err: /invalid pgs2/ }
    it(`should throw error when unionMultiPolygon(pgs2 not array)`, function() {
        k = 1
        assert.throws(() => {
            unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [1, 0], [1, 1], [0, 1]]]],
        pgs2: [],
        opt: {},
    }
    out[k] = [[[[0, 0], [1, 0], [1, 1], [0, 1]]]]
    it(`should return pgs1 when unionMultiPolygon(pgs2 empty)`, function() {
        k = 2
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[2, 0], [4, 0], [4, 4], [2, 4]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
    it(`should union polygon case1 when unionMultiPolygon(polygon)`, function() {
        k = 3
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 0], [2, 2], [0, 2]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
    it(`should union polygon case2 when unionMultiPolygon(polygon)`, function() {
        k = 4
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[0, 0], [2, 2], [0, 4]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
    it(`should union polygon case3 when unionMultiPolygon(polygon)`, function() {
        k = 5
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[0, 0], [4, 0], [4, 4], [0, 4]]],
        pgs2: [[[-1, 0], [2, 1], [-1, 4]]],
        opt: {},
    }
    out[k] = [[[[-1, 0], [0, 0.3333333333333333], [0, 0], [4, 0], [4, 4], [0, 4], [0, 3], [-1, 4], [-1, 0]]]]
    it(`should union polygon case4 when unionMultiPolygon(polygon)`, function() {
        k = 6
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[2, 0], [4, 0], [4, 4], [2, 4]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
    it(`should union multiPolygon case1 when unionMultiPolygon(multiPolygon)`, function() {
        k = 7
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[0, 0], [2, 0], [2, 2], [0, 2]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
    it(`should union multiPolygon case2 when unionMultiPolygon(multiPolygon)`, function() {
        k = 8
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[0, 0], [2, 2], [0, 4]]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
    it(`should union multiPolygon case3 when unionMultiPolygon(multiPolygon)`, function() {
        k = 9
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs1: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]],
        pgs2: [[[[-1, 0], [2, 1], [-1, 4]]]],
        opt: {},
    }
    out[k] = [[[[-1, 0], [0, 0.3333333333333333], [0, 0], [4, 0], [4, 4], [0, 4], [0, 3], [-1, 4], [-1, 0]]]]
    it(`should union multiPolygon case4 when unionMultiPolygon(multiPolygon)`, function() {
        k = 10
        let r = unionMultiPolygon(oin[k].pgs1, oin[k].pgs2, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

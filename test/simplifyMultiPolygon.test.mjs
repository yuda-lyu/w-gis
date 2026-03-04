import assert from 'assert'
import simplifyMultiPolygon from '../src/simplifyMultiPolygon.mjs'


describe(`simplifyMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [10, 0], [10, 0.9], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should simplify polygon case1 when simplifyMultiPolygon(polygon)`, function() {
        k = 0
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [9.995, 0], [9.995, 0.995], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[[0, 0], [9.995, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should simplify polygon case2 when simplifyMultiPolygon(polygon)`, function() {
        k = 1
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [9.99, 0], [9.99, 0.99], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[[0, 0], [9.99, 0], [9.99, 0.99], [10, 1], [0, 1], [0, 0]]]]
    it(`should keep turning point when simplifyMultiPolygon(polygon case3)`, function() {
        k = 2
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [9.99, 0], [9.99, 0.99], [10, 1], [0, 1]],
        ],
        opt: { tolerance: 0.01 },
    }
    out[k] = [[[[0, 0], [9.99, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should simplify with tolerance when simplifyMultiPolygon(polygon + tolerance)`, function() {
        k = 3
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [10, 0], [10, 0.9], [10, 1], [0, 1]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should simplify multiPolygon case1 when simplifyMultiPolygon(multiPolygon)`, function() {
        k = 4
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [9.995, 0], [9.995, 0.995], [10, 1], [0, 1]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 0], [9.995, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should simplify multiPolygon case2 when simplifyMultiPolygon(multiPolygon)`, function() {
        k = 5
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [9.99, 0], [9.99, 0.99], [10, 1], [0, 1]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 0], [9.99, 0], [9.99, 0.99], [10, 1], [0, 1], [0, 0]]]]
    it(`should keep turning point when simplifyMultiPolygon(multiPolygon case3)`, function() {
        k = 6
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [9.99, 0], [9.99, 0.99], [10, 1], [0, 1]],
        ]],
        opt: { tolerance: 0.01 },
    }
    out[k] = [[[[0, 0], [9.99, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should simplify with tolerance when simplifyMultiPolygon(multiPolygon + tolerance)`, function() {
        k = 7
        let r = simplifyMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

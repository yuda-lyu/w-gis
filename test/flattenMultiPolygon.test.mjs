import assert from 'assert'
import flattenMultiPolygon from '../src/flattenMultiPolygon.mjs'


describe(`flattenMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: 'not array',
        opt: {},
    }
    out[k] = { err: /no pgs/ }
    it(`should throw error when flattenMultiPolygon(pgs not array)`, function() {
        k = 0
        assert.throws(() => {
            flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        }, out[k].err)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[2, 0], [4, 0], [4, 4], [2, 4]],
        ],
        opt: { supposeType: 'ringStrings' },
    }
    out[k] = [[[[0, 4], [0, 0], [2, 0], [2, 4], [0, 4]]]]
    it(`should flatten polygon case1 when flattenMultiPolygon(polygon ringStrings)`, function() {
        k = 1
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[0, 0], [2, 0], [2, 2], [0, 2]],
        ],
        opt: { supposeType: 'ringStrings' },
    }
    out[k] = [[[[0, 4], [0, 2], [2, 2], [2, 0], [4, 0], [4, 4], [0, 4]]]]
    it(`should flatten polygon case2 when flattenMultiPolygon(polygon ringStrings)`, function() {
        k = 2
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[0, 0], [2, 2], [0, 4]],
        ],
        opt: { supposeType: 'ringStrings' },
    }
    out[k] = [[[[0, 4], [2, 2], [0, 0], [4, 0], [4, 4], [0, 4]]]]
    it(`should flatten polygon case3 when flattenMultiPolygon(polygon ringStrings)`, function() {
        k = 3
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[2, 0], [4, 0], [4, 4], [2, 4]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 4], [0, 0], [2, 0], [2, 4], [0, 4]]]]
    it(`should flatten multiPolygon case1 when flattenMultiPolygon(multiPolygon)`, function() {
        k = 4
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[0, 0], [2, 0], [2, 2], [0, 2]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 4], [0, 2], [2, 2], [2, 0], [4, 0], [4, 4], [0, 4]]]]
    it(`should flatten multiPolygon case2 when flattenMultiPolygon(multiPolygon)`, function() {
        k = 5
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[0, 0], [2, 2], [0, 4]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 4], [2, 2], [0, 0], [4, 0], [4, 4], [0, 4]]]]
    it(`should flatten multiPolygon case3 when flattenMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[
            [[0, 0], [4, 0], [4, 4], [0, 4]],
            [[10, 0], [12, 2], [10, 4]],
        ]],
        opt: {},
    }
    out[k] = [[[[0, 4], [0, 0], [4, 0], [4, 4], [0, 4]]], [[[10, 4], [10, 0], [12, 2], [10, 4]]]]
    it(`should flatten multiPolygon case3 when flattenMultiPolygon(multiPolygon)`, function() {
        k = 7
        let r = flattenMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

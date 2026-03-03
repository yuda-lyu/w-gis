import assert from 'assert'
import fixCloseMultiPolygon from '../src/fixCloseMultiPolygon.mjs'


describe(`fixCloseMultiPolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]]
    it(`should return closed MultiPolygon when fixCloseMultiPolygon(closed ringString)`, function() {
        k = 0
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]]
    it(`should close ring when fixCloseMultiPolygon(open ringString)`, function() {
        k = 1
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[[0, 0], [100, 0], [100, 1], [0, 1]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]]
    it(`should close polygon when fixCloseMultiPolygon(single polygon)`, function() {
        k = 2
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[[0, 0], [10, 0], [10, 1], [0, 1]]],
        opt: {},
    }
    out[k] = [[[[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]]]
    it(`should close polygon when fixCloseMultiPolygon(width=10 polygon)`, function() {
        k = 3
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [
        [[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]],
        [[[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]],
    ]
    it(`should treat depth=2 as polygons when fixCloseMultiPolygon(default supposeType)`, function() {
        k = 4
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [[
        [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        [[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]],
    ]]
    it(`should treat depth=2 as ringStrings when fixCloseMultiPolygon(supposeType='ringStrings')`, function() {
        k = 5
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [[
        [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        [[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]],
    ]]
    it(`should close all rings when fixCloseMultiPolygon(multiPolygon)`, function() {
        k = 6
        let r = fixCloseMultiPolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

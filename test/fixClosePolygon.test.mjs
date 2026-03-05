import assert from 'assert'
import fixClosePolygon from '../src/fixClosePolygon.mjs'


describe(`fixClosePolygon`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
        opt: {},
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]
    it(`should keep closed ringString when fixClosePolygon(closed ringString)`, function() {
        k = 0
        let r = fixClosePolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [[0, 0], [100, 0], [100, 1], [0, 1]],
        opt: {},
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]
    it(`should close ringString when fixClosePolygon(open ringString)`, function() {
        k = 1
        let r = fixClosePolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]]]
    it(`should close polygon ring when fixClosePolygon(single polygon)`, function() {
        k = 2
        let r = fixClosePolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        pgs: [
            [[0, 0], [10, 0], [10, 1], [0, 1]],
        ],
        opt: {},
    }
    out[k] = [[[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]]
    it(`should close polygon width=10 when fixClosePolygon(single polygon)`, function() {
        k = 3
        let r = fixClosePolygon(oin[k].pgs, oin[k].opt)
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
    out[k] = [[[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]], [[0, 0], [10, 0], [10, 1], [0, 1], [0, 0]]]
    it(`should close all rings when fixClosePolygon(polygon with two rings)`, function() {
        k = 4
        let r = fixClosePolygon(oin[k].pgs, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

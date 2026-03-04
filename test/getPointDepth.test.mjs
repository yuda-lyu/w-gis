import assert from 'assert'
import getPointDepth from '../src/getPointDepth.mjs'


describe(`getPointDepth`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        p: [[[[[1, 2.5], [1.1, 2.3]]]]],
    }
    out[k] = { err: /invalid p\[\[\[\[\[\[1,2\.5\],\[1\.1,2\.3\]\]\]\]\]\]/ }
    it(`should throw error when getPointDepth(depth too deep)`, function() {
        k = 0
        assert.throws(() => {
            getPointDepth(oin[k].p)
        }, out[k].err)
    })

    k++
    oin[k] = {
        p: [[[[1, 2.5], [1.1, 2.3]]]],
    }
    out[k] = 3
    it(`should return 3 when getPointDepth(depth3 with two points)`, function() {
        k = 1
        let r = getPointDepth(oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [[[[1, 2.5]]]],
    }
    out[k] = 3
    it(`should return 3 when getPointDepth(depth3 with one point)`, function() {
        k = 2
        let r = getPointDepth(oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [[[1, 2.5]]],
    }
    out[k] = 2
    it(`should return 2 when getPointDepth(depth2)`, function() {
        k = 3
        let r = getPointDepth(oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [[1, 2.5]],
    }
    out[k] = 1
    it(`should return 1 when getPointDepth(depth1)`, function() {
        k = 4
        let r = getPointDepth(oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: [{ x: 1, y: 2.5 }],
    }
    out[k] = { err: /invalid p\[\[\{"x":1,"y":2\.5\}\]\]/ }
    it(`should throw error when getPointDepth(object point)`, function() {
        k = 5
        assert.throws(() => {
            getPointDepth(oin[k].p)
        }, out[k].err)
    })

})

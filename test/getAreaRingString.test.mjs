import assert from 'assert'
import getAreaRingString from '../src/getAreaRingString.mjs'


describe(`getAreaRingString`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        rs: [[0, 0], [100, 0], [100, 1], [0, 1], [0, 0]],
    }
    out[k] = 100
    it(`should return area when getAreaRingString(closed ringString)`, function() {
        k = 0
        let r = getAreaRingString(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [[0, 0], [100, 0], [100, 1], [0, 1]],
    }
    out[k] = 100
    it(`should return same area when getAreaRingString(open ringString)`, function() {
        k = 1
        let r = getAreaRingString(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        rs: [
            [[0, 0], [100, 0], [100, 1], [0, 1]],
        ],
    }
    out[k] = 0
    it(`should return 0 when getAreaRingString(polygon input)`, function() {
        k = 2
        let r = getAreaRingString(oin[k].rs)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

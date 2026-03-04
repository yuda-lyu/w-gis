import assert from 'assert'
import ptXYtoObj from '../src/ptXYtoObj.mjs'


describe(`ptXYtoObj`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        p: [1, 2],
        opt: {},
    }
    out[k] = { x: 1, y: 2 }
    it(`should convert array point when ptXYtoObj([x,y])`, function() {
        k = 0
        let r = ptXYtoObj(oin[k].p, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        p: { x: 1, y: 2 },
        opt: {},
    }
    out[k] = { x: 1, y: 2 }
    it(`should keep object point when ptXYtoObj({x,y})`, function() {
        k = 1
        let r = ptXYtoObj(oin[k].p, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

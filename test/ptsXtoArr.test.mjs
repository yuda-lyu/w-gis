import assert from 'assert'
import ptsXtoArr from '../src/ptsXtoArr.mjs'


describe(`ptsXtoArr`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ps: [[243], [233], [21]],
        opt: {},
    }
    out[k] = [{ x: 243, ind: 0 }, { x: 233, ind: 1 }, { x: 21, ind: 2 }]
    it(`should convert array points when ptsXtoArr([[x],...])`, function() {
        k = 0
        let r = ptsXtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243 }, { x: 233 }, { x: 21 }],
        opt: {},
    }
    out[k] = [{ x: 243, ind: 0 }, { x: 233, ind: 1 }, { x: 21, ind: 2 }]
    it(`should convert object points when ptsXtoArr([{x},...])`, function() {
        k = 1
        let r = ptsXtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ a: 243 }, { a: 233 }, { a: 21 }],
        opt: { keyX: 'a' },
    }
    out[k] = [{ x: 243, ind: 0 }, { x: 233, ind: 1 }, { x: 21, ind: 2 }]
    it(`should convert object points with keyX when ptsXtoArr([{a},...], keyX='a')`, function() {
        k = 2
        let r = ptsXtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

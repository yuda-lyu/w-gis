import assert from 'assert'
import ptsXYtoArr from '../src/ptsXYtoArr.mjs'


describe(`ptsXYtoArr`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ps: [[243, 206], [233, 225], [21, 325]],
        opt: {},
    }
    out[k] = [{ x: 243, y: 206, ind: 0 }, { x: 233, y: 225, ind: 1 }, { x: 21, y: 325, ind: 2 }]
    it(`should convert array points when ptsXYtoArr([[x,y],...])`, function() {
        k = 0
        let r = ptsXYtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }],
        opt: {},
    }
    out[k] = [{ x: 243, y: 206, ind: 0 }, { x: 233, y: 225, ind: 1 }, { x: 21, y: 325, ind: 2 }]
    it(`should convert object points when ptsXYtoArr([{x,y},...])`, function() {
        k = 1
        let r = ptsXYtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }],
        opt: { keyX: 'a', keyY: 'b' },
    }
    out[k] = [{ x: 243, y: 206, ind: 0 }, { x: 233, y: 225, ind: 1 }, { x: 21, y: 325, ind: 2 }]
    it(`should convert object points with keys when ptsXYtoArr([{a,b},...])`, function() {
        k = 2
        let r = ptsXYtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

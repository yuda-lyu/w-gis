import assert from 'assert'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'


describe(`ptsXYZtoArr`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ps: [[243, 206, 95], [233, 225, 146], [21, 325, 22]],
        opt: {},
    }
    out[k] = [{ x: 243, y: 206, z: 95, ind: 0 }, { x: 233, y: 225, z: 146, ind: 1 }, { x: 21, y: 325, z: 22, ind: 2 }]
    it(`should convert array points when ptsXYZtoArr([[x,y,z],...])`, function() {
        k = 0
        let r = ptsXYZtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }],
        opt: {},
    }
    out[k] = [{ x: 243, y: 206, z: 95, ind: 0 }, { x: 233, y: 225, z: 146, ind: 1 }, { x: 21, y: 325, z: 22, ind: 2 }]
    it(`should convert object points when ptsXYZtoArr([{x,y,z},...])`, function() {
        k = 1
        let r = ptsXYZtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }],
        opt: { keyX: 'a', keyY: 'b', keyZ: 'c' },
    }
    out[k] = [{ x: 243, y: 206, z: 95, ind: 0 }, { x: 233, y: 225, z: 146, ind: 1 }, { x: 21, y: 325, z: 22, ind: 2 }]
    it(`should convert object points with keys when ptsXYZtoArr([{a,b,c},...])`, function() {
        k = 2
        let r = ptsXYZtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

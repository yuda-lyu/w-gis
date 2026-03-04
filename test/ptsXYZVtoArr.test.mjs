import assert from 'assert'
import ptsXYZVtoArr from '../src/ptsXYZVtoArr.mjs'


describe(`ptsXYZVtoArr`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = {
        ps: [[243, 206, 95, 2.2], [233, 225, 146, 15.1], [21, 325, 22, 7.9]],
        opt: {},
    }
    out[k] = [{ x: 243, y: 206, z: 95, v: 2.2, ind: 0 }, { x: 233, y: 225, z: 146, v: 15.1, ind: 1 }, { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }]
    it(`should convert array points when ptsXYZVtoArr([[x,y,z,v],...])`, function() {
        k = 0
        let r = ptsXYZVtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ x: 243, y: 206, z: 95, v: 2.2 }, { x: 233, y: 225, z: 146, v: 15.1 }, { x: 21, y: 325, z: 22, v: 7.9 }],
        opt: {},
    }
    out[k] = [{ x: 243, y: 206, z: 95, v: 2.2, ind: 0 }, { x: 233, y: 225, z: 146, v: 15.1, ind: 1 }, { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }]
    it(`should convert object points when ptsXYZVtoArr([{x,y,z,v},...])`, function() {
        k = 1
        let r = ptsXYZVtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    k++
    oin[k] = {
        ps: [{ a: 243, b: 206, c: 95, d: 2.2 }, { a: 233, b: 225, c: 146, d: 15.1 }, { a: 21, b: 325, c: 22, d: 7.9 }],
        opt: { keyX: 'a', keyY: 'b', keyZ: 'c', keyV: 'd' },
    }
    out[k] = [{ x: 243, y: 206, z: 95, v: 2.2, ind: 0 }, { x: 233, y: 225, z: 146, v: 15.1, ind: 1 }, { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }]
    it(`should convert object points with keys when ptsXYZVtoArr([{a,b,c,d},...])`, function() {
        k = 2
        let r = ptsXYZVtoArr(oin[k].ps, oin[k].opt)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

import assert from 'assert'
import interp1 from '../src/interp1.mjs'


describe(`interp1`, function() {
    let k = -1
    let oin = {}
    let out = {}

    k++
    oin[k] = { ps: [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }], p: { x: 243 }, opt: {} }
    out[k] = { x: 243, y: 206 }
    it(`should return point value when interp1(p at known x)`, async function() {
        k = 0
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: 283 }, opt: {} }
    out[k] = { x: 283, y: 228.0408163265306 }
    it(`should interpolate value when interp1(p at unknown x)`, async function() {
        k = 1
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: 1160 }, opt: {} }
    out[k] = { x: 1160, y: null }
    it(`should return null y when interp1(p out of range)`, async function() {
        k = 2
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }, { a: 953, b: 28 }, { a: 1092, b: 290 }, { a: 744, b: 200 }, { a: 174, b: 3 }, { a: 537, b: 368 }, { a: 1151, b: 371 }, { a: 814, b: 252 }], p: { a: 243 }, opt: { keyX: 'a', keyY: 'b' } }
    out[k] = { a: 243, b: 206 }
    it(`should support custom keys when interp1(keyX/keyY)`, async function() {
        k = 3
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: [{ x: 243 }, { x: 283 }], opt: {} }
    out[k] = [{ x: 243, y: 206 }, { x: 283, y: 228.0408163265306 }]
    it(`should interpolate array targets when interp1(psTar array)`, async function() {
        k = 4
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ x: 0.000243, y: 0.000206 }, { x: 0.000233, y: 0.000225 }, { x: 0.000021, y: 0.000325 }, { x: 0.000953, y: 0.000028 }, { x: 0.001092, y: 0.00029 }, { x: 0.000744, y: 0.000200 }, { x: 0.000174, y: 0.000003 }, { x: 0.000537, y: 0.000368 }, { x: 0.001151, y: 0.000371 }, { x: 0.000814, y: 0.000252 }], p: { x: 0.000243 }, opt: {} }
    out[k] = { x: 0.000243, y: 0.00020600000000000002 }
    it(`should keep full float precision when interp1(small coordinates)`, async function() {
        k = 5
        let r = await interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: oin[0].ps, p: { x: 243 }, opt: { useSync: true } }
    out[k] = { x: 243, y: 206 }
    it(`should return sync result when interp1(useSync=true)`, function() {
        k = 6
        let r = interp1(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

})

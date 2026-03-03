import assert from 'assert'
import interp2 from '../src/interp2.mjs'


describe(`interp2`, function() {
    let k = -1
    let oin = {}
    let out = {}

    let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: {} }
    out[k] = { x: 243, y: 207, z: 97.29447682486813 }
    it(`should interpolate naturalNeighbor when interp2(case1)`, async function() {
        k = 0
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 283, y: 207 }, opt: {} }
    out[k] = { x: 283, y: 207, z: 114.43040421951906 }
    it(`should interpolate naturalNeighbor when interp2(case2)`, async function() {
        k = 1
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 1160, y: 380 }, opt: {} }
    out[k] = { x: 1160, y: 380, z: null }
    it(`should return null z when interp2(outside convex hull)`, async function() {
        k = 2
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }], p: { a: 243, b: 207 }, opt: { keyX: 'a', keyY: 'b', keyZ: 'c' } }
    out[k] = { a: 243, b: 207, c: 97.29447682486813 }
    it(`should support custom keys when interp2(keyX/keyY/keyZ)`, async function() {
        k = 3
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps, p: [{ x: 243, y: 207 }, { x: 283, y: 207 }], opt: {} }
    out[k] = [{ x: 243, y: 207, z: 97.29447682486813 }, { x: 283, y: 207, z: 114.43040421951906 }]
    it(`should interpolate array targets when interp2(psTar array)`, async function() {
        k = 4
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: { method: 'kriging' } }
    out[k] = { x: 243, y: 207, z: 97.4283695751981 }
    it(`should interpolate by kriging when interp2(method='kriging')`, async function() {
        k = 5
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.000021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.000028, z: 223 }, { x: 0.001092, y: 0.00029, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.000003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }], p: { x: 0.000243, y: 0.000207 }, opt: {} }
    out[k] = { x: 0.000243, y: 0.000207, z: 97.2944768248678 }
    it(`should keep full float precision when interp2(small coordinates)`, async function() {
        k = 6
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: { scale: 1000 } }
    out[k] = { x: 243, y: 207, z: 97.29447682486855 }
    it(`should support scale when interp2(scale=1000)`, async function() {
        k = 7
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: { useSync: true } }
    out[k] = { x: 243, y: 207, z: 97.29447682486813 }
    it(`should return sync result when interp2(useSync=true)`, function() {
        k = 8
        let r = interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

})

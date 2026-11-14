import assert from 'assert'
import interp2 from '../src/interp2.mjs'


//eqNN, 自然鄰點法之結果: 座標鍵逐字相同, z皆為null或相對差不大於1e-12
//interp2之預設方法為interp2NaturalNeighbor; naturalNeighbor案例之期望值為有理數精確解(以原始輸入計算, 見test/interp2NaturalNeighbor.test.mjs之說明; 1.1.27之值依序為97.29447682486813、114.43040421951908、小座標97.2944768248678、scale 1000之97.29447682486855), 本函數之z經正規化往返而有末位誤差, 以相對容許誤差比對
let eqNN = (r, rr) => {
    if (Array.isArray(rr)) {
        assert.strict.equal(r.length, rr.length)
        rr.forEach((v, i) => eqNN(r[i], v))
        return
    }
    let ks = Object.keys(rr)
    assert.strict.deepStrictEqual(Object.keys(r), ks)
    assert.strict.equal(r[ks[0]], rr[ks[0]])
    assert.strict.equal(r[ks[1]], rr[ks[1]])
    let a = r[ks[2]]
    let b = rr[ks[2]]
    if (b === null) {
        assert.strict.equal(a, null)
    }
    else {
        assert.ok(typeof a === 'number' && Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b)), `${a} vs ${b}`)
    }
}


describe(`interp2`, function() {
    let k = -1
    let oin = {}
    let out = {}

    let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: {} }
    out[k] = { x: 243, y: 207, z: 97.29447682486817 }
    it(`should interpolate naturalNeighbor when interp2(case1)`, async function() {
        k = 0
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 283, y: 207 }, opt: {} }
    out[k] = { x: 283, y: 207, z: 114.43040421951916 }
    it(`should interpolate naturalNeighbor when interp2(case2)`, async function() {
        k = 1
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 1160, y: 380 }, opt: {} }
    out[k] = { x: 1160, y: 380, z: null }
    it(`should return null z when interp2(outside convex hull)`, async function() {
        k = 2
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps: [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }], p: { a: 243, b: 207 }, opt: { keyX: 'a', keyY: 'b', keyZ: 'c' } }
    out[k] = { a: 243, b: 207, c: 97.29447682486817 }
    it(`should support custom keys when interp2(keyX/keyY/keyZ)`, async function() {
        k = 3
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps, p: [{ x: 243, y: 207 }, { x: 283, y: 207 }], opt: {} }
    out[k] = [{ x: 243, y: 207, z: 97.29447682486817 }, { x: 283, y: 207, z: 114.43040421951916 }]
    it(`should interpolate array targets when interp2(psTar array)`, async function() {
        k = 4
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: { method: 'kriging' } } //method='kriging'走interp2Kriging, 默認friedrich引擎
    out[k] = { x: 243, y: 207, z: 97.49846235108123 }
    it(`should interpolate by kriging when interp2(method='kriging')`, async function() {
        k = 5
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        assert.strict.deepStrictEqual(r, out[k])
    })

    k++
    oin[k] = { ps: [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.000021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.000028, z: 223 }, { x: 0.001092, y: 0.00029, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.000003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }], p: { x: 0.000243, y: 0.000207 }, opt: {} }
    out[k] = { x: 0.000243, y: 0.000207, z: 97.29447682486816 }
    it(`should keep full float precision when interp2(small coordinates)`, async function() {
        k = 6
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: { scale: 1000 } }
    out[k] = { x: 243, y: 207, z: 97.29447682486817 }
    it(`should support scale when interp2(scale=1000)`, async function() {
        k = 7
        let r = await interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

    k++
    oin[k] = { ps, p: { x: 243, y: 207 }, opt: { useSync: true } }
    out[k] = { x: 243, y: 207, z: 97.29447682486817 }
    it(`should return sync result when interp2(useSync=true)`, function() {
        k = 8
        let r = interp2(oin[k].ps, oin[k].p, oin[k].opt)
        eqNN(r, out[k])
    })

})

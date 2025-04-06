import assert from 'assert'
import interp2NaturalNeighbor from '../src/interp2NaturalNeighbor.mjs'


describe(`interp2NaturalNeighbor`, function() {
    let k = -1
    let oin = {}
    let out = {}

    let ps
    let p
    let r

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 243,
        y: 207,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486813 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p})`, function() {
        k = 0
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 1243,
        y: 1207,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 1243, y: 1207, z: null }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p})`, function() {
        k = 1
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 243,
        y: 207,
    }
    let funInterpFragment = (msg) => {
        // console.log('funInterpFragment', msg)
        return msg.v //預設回傳msg.v, 三角形三角點各點v為rA*z, 故三點之rA合為1, 指定內插值z為三角點v之總和(v1,v2,v3)
    }
    // r = interp2NaturalNeighbor(ps, p, { funInterpFragment })
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486813 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p}, { funInterpFragment })`, function() {
        k = 2
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p, { funInterpFragment })
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 1243,
        y: 1207,
    }
    let funInterpFragmentNoUse = (msg) => {
        // console.log('funInterpFragmentNoUse', msg)
        return msg.v //預設回傳msg.v, 此處因內插點於原始點所形成最小凸多邊形之外, 故無法內插, 亦不會呼叫funInterpFragment
    }
    // r = interp2NaturalNeighbor(ps, p, { funInterpFragment: funInterpFragmentNoUse })
    // console.log(r)
    r = { x: 1243, y: 1207, z: null }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p}, { funInterpFragment: funInterpFragmentNoUse })`, function() {
        k = 3
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p, { funInterpFragment: funInterpFragmentNoUse })
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 243,
        y: 207,
    }
    let funInterpFragments = (msg) => {
        // console.log('funInterpFragments', msg)
        // let vt = msg.ps[0].v + msg.ps[1].v + msg.ps[2].v
        // console.log('vt', vt)
        // let vv = msg.funInv(msg.v) //因msg.v有正規化, 若要自行計算最終內插值須自行調用msg.funInv
        // console.log('vv', vv)
        // console.log('msg.v', msg.v)
        return msg.v //預設回傳msg.v, 三角形三角點為msg.ps, 各點v為rA*z, 故三點之rA合為1, 指定內插值z為三角點v之總和(v1,v2,v3)
    }
    // r = interp2NaturalNeighbor(ps, p, { funInterpFragments })
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486813 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p}, { funInterpFragments })`, function() {
        k = 4
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p, { funInterpFragments })
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 283,
        y: 207,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 283, y: 207, z: 114.43040421951906 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p})`, function() {
        k = 5
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 1160,
        y: 380,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 1160, y: 380, z: null }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p})`, function() {
        k = 6
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }]
    p = {
        a: 243,
        b: 207,
    }
    // r = interp2NaturalNeighbor(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
    // console.log(r)
    r = { a: 243, b: 207, c: 97.29447682486813 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p}, { keyX: 'a', keyY: 'b', keyZ: 'c' })`, function() {
        k = 7
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = [
        {
            x: 243,
            y: 207,
        },
        {
            x: 283,
            y: 207,
        },
    ]
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = [
        { x: 243, y: 207, z: 97.29447682486813 },
        { x: 283, y: 207, z: 114.43040421951906 }
    ]

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p})`, function() {
        k = 8
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.000021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.000028, z: 223 }, { x: 0.001092, y: 0.00029, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.000003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }]
    p = {
        x: 0.000243,
        y: 0.000207,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 0.000243, y: 0.000207, z: 97.2944768248678 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p})`, function() {
        k = 9
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p)
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 243,
        y: 207,
    }
    // r = interp2NaturalNeighbor(ps, p, { scale: 1000 })
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486855 }

    k++
    oin[k] = {
        ps,
        p,
    }
    out[k] = r
    it(`should return ${JSON.stringify(out[k])} when interp2NaturalNeighbor(${oin[k].ps}, ${oin[k].p}, { scale: 1000 })`, function() {
        k = 10
        let r = interp2NaturalNeighbor(oin[k].ps, oin[k].p, { scale: 1000 })
        let rr = out[k]
        assert.strict.deepStrictEqual(r, rr)
    })

})

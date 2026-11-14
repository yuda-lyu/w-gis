import assert from 'assert'
import { orient2d, incircle } from 'robust-predicates'
import interp2NaturalNeighbor from '../src/interp2NaturalNeighbor.mjs'


//assertNear, 點物件(或其陣列)之比較: 座標鍵逐字相同, z皆為null或相對差不大於tol
//既有案例之期望值為有理數精確解(以原始輸入計算: z=Σai·zi/Σai, ai為test/tools/sibsonExactRef.mjs之有理數被奪面積areasRational, zi亦轉為有理數, 最後一次捨入為double); 本函數之z經正規化往返而有末位誤差, 故以相對容許誤差比對
let assertNear = (r, rr, tol = 1e-12) => {
    if (Array.isArray(rr)) {
        assert.strict.equal(Array.isArray(r), true)
        assert.strict.equal(r.length, rr.length)
        rr.forEach((v, i) => assertNear(r[i], v, tol))
        return
    }
    assert.strict.deepStrictEqual(Object.keys(r), Object.keys(rr))
    for (let k of Object.keys(rr)) {
        let a = r[k]
        let b = rr[k]
        if (b === null || typeof b !== 'number' || k !== Object.keys(rr)[2]) {
            assert.strict.deepStrictEqual(a, b, `key ${k}`)
        }
        else {
            assert.strict.equal(typeof a, 'number', `key ${k}`)
            assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `key ${k}: ${a} vs ${b}`)
        }
    }
}


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
    r = { x: 243, y: 207, z: 97.29447682486817 } //有理數精確解(以原始輸入計算, test/tools/sibsonExactRef.mjs之面積); 1.1.27為97.29447682486813

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
        assertNear(r, rr)
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
        return msg.v //預設回傳msg.v, 各自然鄰點之v為areaRatio*z, 各點areaRatio合為1, 內插值z為各點v之總和
    }
    // r = interp2NaturalNeighbor(ps, p, { funInterpFragment })
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486817 } //有理數精確解; 1.1.27為97.29447682486813

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
        assertNear(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 1243,
        y: 1207,
    }
    let funInterpFragmentNoUse = (msg) => {
        // console.log('funInterpFragmentNoUse', msg)
        return msg.v //預設回傳msg.v, 此處因內插點於原始點凸包之外(預設limitInsideHull為true), 故無法內插, 亦不會呼叫funInterpFragment
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
        // let vv = msg.funInv(msg.v) //因msg.v有正規化, 若要自行計算最終內插值須自行調用msg.funInv
        return msg.v //預設回傳msg.v, 各自然鄰點為msg.ps, 各點v為areaRatio*z, 各點areaRatio合為1, 內插值z為各點v之總和
    }
    // r = interp2NaturalNeighbor(ps, p, { funInterpFragments })
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486817 } //有理數精確解; 1.1.27為97.29447682486813

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
        assertNear(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 283,
        y: 207,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 283, y: 207, z: 114.43040421951916 } //有理數精確解; 1.1.27為114.43040421951908

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
        assertNear(r, rr)
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
    r = { a: 243, b: 207, c: 97.29447682486817 } //有理數精確解; 1.1.27為97.29447682486813

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
        assertNear(r, rr)
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
        { x: 243, y: 207, z: 97.29447682486817 }, //有理數精確解; 1.1.27為97.29447682486813
        { x: 283, y: 207, z: 114.43040421951916 } //有理數精確解; 1.1.27為114.43040421951908
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
        assertNear(r, rr)
    })

    ps = [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.000021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.000028, z: 223 }, { x: 0.001092, y: 0.00029, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.000003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }]
    p = {
        x: 0.000243,
        y: 0.000207,
    }
    // r = interp2NaturalNeighbor(ps, p)
    // console.log(r)
    r = { x: 0.000243, y: 0.000207, z: 97.29447682486816 } //有理數精確解(座標為範例之1e-6倍, 十進位轉換使其與原例相差1 ulp); 1.1.27為97.2944768248678

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
        assertNear(r, rr)
    })

    ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
    p = {
        x: 243,
        y: 207,
    }
    // r = interp2NaturalNeighbor(ps, p, { scale: 1000 })
    // console.log(r)
    r = { x: 243, y: 207, z: 97.29447682486817 } //有理數精確解(權重與scale無關, 只差z之正規化往返); 1.1.27為97.29447682486855

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
        assertNear(r, rr)
    })

})


//---------------------------------------------------------------- Liang & Hale 算法、凸包外投影、偵測與特例

//rng, 可重現之亂數(mulberry32)
let rng = (seed) => {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = a + 0x6D2B79F5 | 0
        let t = Math.imul(a ^ a >>> 15, 1 | a)
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
}

//run, 內插並以回呼取各點之權重(indSrc->areaRatio)、method與回呼次數
let run = (src, qs, opt = {}) => {
    let one = !Array.isArray(qs)
    let arr = one ? [qs] : qs
    let info = arr.map(() => ({ n: 0, method: null, w: null, ps: null }))
    let errs = []
    let r = interp2NaturalNeighbor(src, qs, {
        ...opt,
        funInterpFragments: (msg) => {
            let o = info[msg.indTar]
            o.n++
            o.method = msg.method
            o.ps = msg.ps
            o.w = new Map(msg.ps.map((p) => [p.indSrc, p.areaRatio]))
            return msg.v
        },
        funInterpError: (e) => {
            errs.push(e)
        },
    })
    let rs = one ? [r] : r
    return { r: rs, z: rs.map((v) => v.z), info, errs }
}

//maxDiff, 兩組權重逐來源點相減之最大絕對值(缺者視為0)
let maxDiff = (m, pairs) => {
    let e = new Map(pairs)
    let d = 0
    for (let [k, v] of m) {
        d = Math.max(d, Math.abs(v - (e.has(k) ? e.get(k) : 0)))
    }
    for (let [k, v] of e) {
        if (!m.has(k)) {
            d = Math.max(d, Math.abs(v))
        }
    }
    return d
}

//hullOf, 原始點之凸包(monotone chain, 逆時針), 回傳指標
let hullOf = (src) => {
    let id = src.map((_, i) => i).sort((i, j) => (src[i].x - src[j].x) || (src[i].y - src[j].y))
    let cr = (o, a, b) => (src[a].x - src[o].x) * (src[b].y - src[o].y) - (src[a].y - src[o].y) * (src[b].x - src[o].x)
    let lo = []
    for (let i of id) {
        while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], i) <= 0) {
            lo.pop()
        }
        lo.push(i)
    }
    let up = []
    for (let i of [...id].reverse()) {
        while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], i) <= 0) {
            up.pop()
        }
        up.push(i)
    }
    return lo.slice(0, -1).concat(up.slice(0, -1))
}

//案例之原始點(與產生精確解之腳本相同之建構)
let psA = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
let mkGrid = () => {
    let src = []
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            src.push({ x: i / 8, y: j / 8, z: Math.sin(i) + Math.cos(j) })
        }
    }
    return src
}
let mkRot = () => {
    let src = []
    for (let i = 0; i <= 14; i++) {
        for (let j = 0; j <= 14; j++) {
            src.push({ x: 121 + (7 * i - 1 * j) * 0.001, y: 24 + (1 * i + 7 * j) * 0.001, z: i + j })
        }
    }
    return src
}
let mkRand = (seed, n) => {
    let r = rng(seed)
    let src = []
    for (let i = 0; i < n; i++) {
        src.push({ x: r(), y: r(), z: i })
    }
    return src
}
let mkCluster = (rc) => {
    let r = rng(31337)
    let src = []
    let centers = [[0.3, 0.7], [0.62, 0.41], [0.81, 0.83]]
    for (let c of centers) {
        for (let i = 0; i < 30; i++) {
            src.push({ x: c[0] + rc * (r() - 0.5), y: c[1] + rc * (r() - 0.5), z: i })
        }
    }
    for (let i = 0; i < 60; i++) {
        src.push({ x: r(), y: r(), z: i })
    }
    return src
}
let mkBump = (bump) => {
    let r = rng(4711)
    let src = []
    for (let i = 0; i <= 20; i++) {
        let x = i / 20
        src.push({ x, y: -bump * 4 * x * (1 - x), z: i })
    }
    for (let i = 0; i < 100; i++) {
        src.push({ x: r(), y: 0.02 + 0.98 * r(), z: i })
    }
    src.push({ x: 0, y: 1, z: 0 })
    src.push({ x: 1, y: 1, z: 1 })
    return src
}
let mkPair = (sep) => {
    return [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.5 + sep, 0.5], [0.3, 0.7], [0.71, 0.33]].map(([x, y], i) => ({ x, y, z: i }))
}

//EXACT, 有理數精確解(以原始輸入之double為準, 全程BigInt), 非本函數之輸出; 各值已以 test/tools/sibsonExactRef.mjs(半平面裁切, 不經三角網與外心)複核: cluster 以該工具重算, 其餘各組與之差不大於2.3e-15(任務 gis145 之核對)
let EXACT = {
    ps: [
        [{ x: 243, y: 207 }, [[0, 0.95781293366639], [1, 0.04079933388842546], [7, 0.0013877324451845414]]],
        [{ x: 283, y: 207 }, [[0, 0.6434215276531018], [1, 0.14280611286707687], [5, 0.03936136597016096], [6, 0.08145679149922869], [7, 0.09295420201043166]]],
        [{ x: 1050, y: 201 }, [[3, 0.45775242564045443], [4, 0.15508492901630522], [8, 0.3835572776541364], [9, 0.0036053676891039544]]], //1.1.27裁切於正方形而得106.116, 精確解之z為141.564
        [{ x: 700, y: 330 }, [[5, 0.04709114087834361], [7, 0.5590861973386373], [8, 0.13104823894447032], [9, 0.26277442283854885]]],
        [{ x: 400, y: 300 }, [[0, 0.19167103145033218], [1, 0.1953730651949782], [2, 0.053835341006668404], [5, 0.03524135133345355], [6, 0.002124596972212047], [7, 0.5217546140423556]]],
        [{ x: 279, y: 346.4 }, [[0, 0.00005406803378779299], [1, 0.0007866768726988068], [2, 0.4995057252495464], [7, 0.499653529843967]]], //凸包邊內側0.1
    ],
    grid: [
        [{ x: 0.3125, y: 0.375 }, [[20, 0.027777777777777776], [21, 0.4444444444444444], [22, 0.027777777777777776], [29, 0.027777777777777776], [30, 0.4444444444444444], [31, 0.027777777777777776]]], //恰在格線邊中點
        [{ x: 0.3125, y: 0.4375 }, [[21, 0.25], [22, 0.25], [30, 0.25], [31, 0.25]]], //恰在格心(四點共圓之圓心)
        [{ x: 0.28125, y: 0.40625 }, [[21, 0.5625], [22, 0.1875], [30, 0.1875], [31, 0.0625]]], //恰在格之對角線上
        [{ x: 0.2890625, y: 0.4296875 }, [[21, 0.38671875], [22, 0.30078125], [30, 0.17578125], [31, 0.13671875]]],
    ],
    rot: [
        [{ x: 121.0205, y: 24.0315 }, [[48, 0.02777777777794465], [49, 0.44444444444407427], [50, 0.02777777777800315], [63, 0.027777777777569828], [64, 0.4444444444446537], [65, 0.027777777777754385]]], //7:1斜向格點, 格線中點
        [{ x: 121.02, y: 24.035 }, [[49, 0.24999999999992883], [50, 0.2500000000005684], [64, 0.2500000000000001], [65, 0.24999999999950265]]], //格心
        [{ x: 121.041, y: 24.0755 }, [[114, 0.18749999999994485], [115, 0.5625000000009125], [129, 0.06249999999983785], [130, 0.18749999999930483]]],
        [{ x: 121.0899, y: 24.0157 }, [[180, 0.06872633390681801], [181, 0.045817555938071804], [195, 0.5225473321863503], [196, 0.3483648881236323], [210, 0.008726333907114832], [211, 0.0058175559380127225]]],
    ],
    nearHull: [ //200隨機點, 凸包邊(來源點79->52)之t=0.37處向內h(正方形邊長之倍數)
        [{ x: 0.03982683573616669, y: 0.9109345098561608, h: 1e-2 }, [[34, 0.010274593106646678], [52, 0.3622894211486075], [58, 0.009912323194529959], [79, 0.6172320276024894], [119, 0.00029163494772644667]]],
        [{ x: 0.03862333642828744, y: 0.9113564755944535, h: 1e-4 }, [[34, 0.00010299081431484152], [52, 0.36992274437367945], [58, 0.00009901049834008184], [79, 0.629872730957641], [119, 0.000002523356024688036]]],
        [{ x: 0.03861130143520865, y: 0.9113606952518364, h: 1e-6 }, [[34, 0.000001029933612084236], [52, 0.369999227428284], [58, 9.900927399405717e-7], [79, 0.6299987273516099], [119, 2.51937540291732e-8]]],
        [{ x: 0.03861118108527786, y: 0.9113607374484103, h: 1e-8 }, [[34, 1.0299338771647945e-8], [52, 0.369999992274281], [58, 9.900926272947976e-9], [79, 0.6299999872735204], [119, 2.5193356178929684e-10]]],
        [{ x: 0.03861117988177855, y: 0.9113607378703761, h: 1e-10 }, [[34, 1.0299342975267666e-10], [52, 0.36999999992274263], [58, 9.900930277210344e-11], [79, 0.6299999998727354], [119, 2.519336241811237e-12]]],
        [{ x: 0.03861117986974356, y: 0.9113607378745956, h: 1e-12 }, [[34, 1.0302001978422625e-12], [52, 0.36999999999922645], [58, 9.903486420949016e-13], [79, 0.6299999999987278], [119, 2.519986660131835e-14]]],
        [{ x: 0.03861117986962321, y: 0.9113607378746379, h: 1e-14 }, [[34, 1.0463113584729811e-14], [52, 0.36999999999999167], [58, 1.0058365696707632e-14], [79, 0.6299999999999876], [119, 2.559396388368491e-16]]],
        [{ x: 0.038611179869622106, y: 0.9113607378746383, h: 1e-15 }, [[34, 9.9947087755444e-16], [52, 0.36999999999999916], [58, 9.608080336930992e-16], [79, 0.6299999999999989], [119, 2.4448192534440235e-17]]],
    ],
    cluster: [ //群半徑1e-11之極小群(delaunator之三角網有非Delaunay之內部邊且有反向三角形, 須翻邊修正與以掃描線法重建); 精確解以原始輸入之double為準(test/tools/sibsonExactRef.mjs); 草案原值為其正規化後(捨入)座標之精確解, 與原始座標之精確解差6.5e-5
        [{ x: 0.2999999999999992, y: 0.6999999999981283 }, [[0, 0.21985536040077994], [8, 0.2721260743936364], [17, 0.027672520073927568], [20, 0.010386138250040583], [27, 0.00004849776131231963], [28, 0.46284907874235925], [29, 0.007062330377943948]]],
        [{ x: 0.620000000000104, y: 0.4100000000001641 }, [[33, 0.5066758258703226], [37, 0.013987936022654582], [51, 0.05307687004716874], [53, 0.3722552989228678], [54, 0.025800086453626275], [55, 0.02820398268335999]]],
        [{ x: 0.8100000000011595, y: 0.8299999999987916 }, [[65, 0.09399004686107763], [68, 0.19357974476841874], [69, 0.0019429651302933929], [71, 0.04804461928860996], [76, 0.01002852518304271], [87, 0.5844846204485644], [89, 0.06792947831999316]]],
    ],
    bump: [ //凸包底邊21點近乎共線(凸出1e-12), 外心極遠
        [{ x: 0.31, y: 0.0001 }, [[6, 0.798609030923979], [7, 0.2003929432148742], [54, 0.0009593807693432474], [94, 0.000038645091803660804]]],
        [{ x: 0.5, y: 0.003 }, [[9, 0.0360045650935657], [10, 0.9078721693847096], [11, 0.03192932171535802], [85, 0.024193943806366632]]],
        [{ x: 0.77, y: 0.02 }, [[14, 0.03652686454565152], [15, 0.5462585855640832], [16, 0.2050329264574045], [62, 0.09682650948599307], [98, 0.11535511394686766]]],
    ],
    pair52: [ //第4、5點相距2^-52(半平面精確解)
        [{ x: 0.4, y: 0.45 }, [[0, 0.15303774553499866], [4, 0.5657558185184888], [5, 0.008116341115326395], [6, 0.1971464564562189], [7, 0.07594363837496729]]],
    ],
    pair8: [ //第4、5點相距1e-8, 內插點在兩點之間(半平面精確解; 初版外心以三角形第一頂點為基準時差4.3e-9)
        [{ x: 0.500000005, y: 0.5000000033333334 }, [[2, 5.8685460873218e-10], [4, 0.22535211330899094], [5, 0.7746478709046241], [6, 1.519953041361938e-8]]],
    ],
}


describe(`interp2NaturalNeighbor 凸包內之Sibson權重(Liang & Hale)`, function() {

    //spec: JSDoc算法(3)、可內插範圍(1): 凸包內為未裁切之Sibson權重(新、舊Voronoi區塊皆不裁切之面積比)
    let cases = [
        ['10點範例(含1.1.27裁切或交集失敗之點)', psA, EXACT.ps],
        ['9x9格點: 恰在格線邊中點、格心、對角線上與一般點', mkGrid(), EXACT.grid],
        ['7:1斜向之旋轉格點', mkRot(), EXACT.rot],
        ['靠近凸包邊(內側h=1e-2至1e-15)', mkRand(555, 200), EXACT.nearHull],
        ['極小群(群半徑1e-11, 須翻邊與重建三角網)', mkCluster(1e-11), EXACT.cluster],
        ['凸包邊近乎共線(凸出1e-12)', mkBump(1e-12), EXACT.bump],
        ['兩原始點相距2^-52(delaunator視為重複而略過, 改以掃描線法建網)', mkPair(2 ** -52), EXACT.pair52],
        ['兩原始點相距1e-8且內插點在兩點之間(外心以最長邊之對角為基準方不失準)', mkPair(1e-8), EXACT.pair8],
    ]
    for (let [tag, src, exs] of cases) {
        it(`與有理數精確解之權重差不大於1e-12: ${tag}`, function() {
            let o = run(src, exs.map((e) => ({ x: e[0].x, y: e[0].y })))
            assert.strict.deepStrictEqual(o.errs, [])
            exs.forEach((e, i) => {
                assert.strict.equal(o.info[i].n, 1)
                assert.ok(['sibson', 'sibsonExact'].includes(o.info[i].method), `method ${o.info[i].method}`)
                let d = maxDiff(o.info[i].w, e[1])
                assert.ok(d <= 1e-12, `${JSON.stringify(e[0])} maxDiff ${d}`)
            })
        })
    }

    //spec: Sibson權重之一次函數重現性(局部座標性質): 凸包內 z=a*x+b*y+c 之內插值等於該一次函數
    it(`一次函數重現: 300隨機點、凸包內500點, |z-f|不大於1e-12, 權重皆為正且合為1`, function() {
        let f = (x, y) => 3 * x - 2 * y + 0.7
        let src = mkRand(11, 300).map((p) => ({ x: p.x, y: p.y, z: f(p.x, p.y) }))
        let r = rng(12)
        let qs = []
        for (let i = 0; i < 500; i++) {
            qs.push({ x: 0.05 + 0.9 * r(), y: 0.05 + 0.9 * r() })
        }
        let o = run(src, qs)
        let nIn = 0
        qs.forEach((q, i) => {
            if (o.info[i].method === 'sibson' || o.info[i].method === 'sibsonExact') {
                nIn++
                assert.ok(Math.abs(o.z[i] - f(q.x, q.y)) <= 1e-12, `i=${i} z=${o.z[i]} f=${f(q.x, q.y)}`)
                let s = 0
                for (let w of o.info[i].w.values()) {
                    assert.ok(w > 0)
                    s += w
                }
                assert.ok(Math.abs(s - 1) <= 1e-14)
            }
        })
        assert.ok(nIn >= 450, `nIn=${nIn}`)
    })

    //spec: 查詢點恰在Delaunay邊上亦得正確值(粗格內插成細格之常見用法); 格線上之點恰在內部邊上
    it(`9x9粗格內插成33x33細格: 1089點皆有值, 方法為vertex 81、hullEdge 96、sibson 912, 一次函數重現誤差不大於1e-12`, function() {
        let f = (x, y) => 2 * x + 3 * y + 1
        let src = []
        for (let i = 0; i <= 8; i++) {
            for (let j = 0; j <= 8; j++) {
                src.push({ x: i / 8, y: j / 8, z: f(i / 8, j / 8) })
            }
        }
        let qs = []
        for (let i = 0; i <= 32; i++) {
            for (let j = 0; j <= 32; j++) {
                qs.push({ x: i / 32, y: j / 32 })
            }
        }
        let o = run(src, qs)
        let cnt = {}
        qs.forEach((q, i) => {
            assert.strict.equal(typeof o.z[i], 'number')
            assert.ok(Math.abs(o.z[i] - f(q.x, q.y)) <= 1e-12, `i=${i}`)
            cnt[o.info[i].method] = (cnt[o.info[i].method] || 0) + 1
        })
        assert.strict.deepStrictEqual(cnt, { vertex: 81, hullEdge: 96, sibson: 912 })
    })

    //spec: 旋轉或斜向之規則格點(凸包邊上之點數學上共線, 正規化後成極扁三角形)
    it(`7:1斜向格點: 凸包內400點皆有值, 一次函數(約510之量級)重現之絕對誤差不大於1e-10(相對約2e-13)`, function() {
        let f = (x, y) => 5 * x - 4 * y + 1
        let src = mkRot().map((p) => ({ x: p.x, y: p.y, z: f(p.x, p.y) }))
        let r = rng(99)
        let qs = []
        for (let k = 0; k < 400; k++) {
            let i = 0.5 + r() * 13
            let j = 0.5 + r() * 13
            qs.push({ x: 121 + (7 * i - 1 * j) * 0.001, y: 24 + (1 * i + 7 * j) * 0.001 })
        }
        let o = run(src, qs)
        qs.forEach((q, i) => {
            assert.ok(['sibson', 'sibsonExact'].includes(o.info[i].method), `i=${i} ${o.info[i].method}`)
            assert.ok(Math.abs(o.z[i] - f(q.x, q.y)) <= 1e-12 * 100, `i=${i}`) //f約為100之量級
        })
    })

    //spec: JSDoc可內插範圍(1): area與areaTotal為未裁切之面積(正規化座標單位); areaRatio=area/areaTotal; 權重與scale無關
    it(`area、areaTotal: 各點area之和等於areaTotal, areaRatio等於area/areaTotal; scale為1000時面積為1e6倍而areaRatio不變`, function() {
        let o1 = run(psA, { x: 1050, y: 201 })
        let o2 = run(psA, { x: 1050, y: 201 }, { scale: 1000 })
        let p1 = o1.info[0].ps
        let p2 = o2.info[0].ps
        let s = p1.reduce((t, p) => t + p.area, 0)
        assert.ok(Math.abs(s - p1[0].areaTotal) <= 1e-12 * p1[0].areaTotal)
        p1.forEach((p, i) => {
            assert.ok(Math.abs(p.areaRatio - p.area / p.areaTotal) <= 1e-15)
            assert.strict.equal(p.indSrc, p2[i].indSrc)
            assert.ok(Math.abs(p2[i].areaRatio - p.areaRatio) <= 1e-15)
            assert.ok(Math.abs(p2[i].area - p.area * 1e6) <= 1e-9 * p2[i].area)
        })
    })

})


describe(`interp2NaturalNeighbor 凸包邊與凸包外`, function() {

    //正方形(0,0)-(8,8)四角與內部4點, z為一次函數
    let f = (x, y) => 0.5 * x + 0.25 * y + 1
    let sq = [[0, 0], [8, 0], [8, 8], [0, 8], [2, 3], [5, 6], [6, 2], [3, 5]].map(([x, y]) => ({ x, y, z: f(x, y) }))

    //spec: JSDoc可內插範圍(2): 凸包邊上取該邊兩端點依投影位置線性分配權重
    it(`恰在凸包邊上: (4,0)為兩端點各0.5, (8,2)為(8,0)0.75、(8,8)0.25, method為hullEdge`, function() {
        let o = run(sq, [{ x: 4, y: 0 }, { x: 8, y: 2 }])
        assert.strict.equal(o.info[0].method, 'hullEdge')
        assert.ok(maxDiff(o.info[0].w, [[0, 0.5], [1, 0.5]]) <= 1e-15)
        assert.strict.equal(o.info[1].method, 'hullEdge')
        assert.ok(maxDiff(o.info[1].w, [[1, 0.75], [2, 0.25]]) <= 1e-15)
        assert.ok(Math.abs(o.z[0] - f(4, 0)) <= 1e-12)
        assert.ok(Math.abs(o.z[1] - f(8, 2)) <= 1e-12)
    })

    //spec: JSDoc可內插範圍(2): 凸包外而距凸包不大於正方形邊長之1e-9倍(此例8e-9)者視為在凸包邊上, 與limitInsideHull無關; 超出者預設為null
    it(`凸包外側容許值內(距邊3e-9)預設即有值且為兩端點線性; 超出容許值(距邊3e-8)預設為null、false時為投影`, function() {
        let o = run(sq, [{ x: 4, y: -3e-9 }, { x: 4, y: -3e-8 }])
        assert.strict.equal(o.info[0].method, 'hullEdge')
        assert.ok(maxDiff(o.info[0].w, [[0, 0.5], [1, 0.5]]) <= 1e-15)
        assert.strict.equal(o.z[1], null)
        assert.strict.equal(o.info[1].n, 0)
        let o2 = run(sq, { x: 4, y: -3e-8 }, { limitInsideHull: false })
        assert.strict.equal(o2.info[0].method, 'projection')
        assert.ok(maxDiff(o2.info[0].w, [[0, 0.5], [1, 0.5]]) <= 1e-15)
    })

    //spec: 凸包內外連續(凸包邊上之Sibson極限為兩端點線性)
    it(`靠近凸包邊: 內側h由1e-2至1e-15之權重收斂至兩端點線性(差不大於約h之10倍)`, function() {
        let o = run(mkRand(555, 200), EXACT.nearHull.map((e) => ({ x: e[0].x, y: e[0].y })))
        EXACT.nearHull.forEach((e, i) => {
            let d = maxDiff(o.info[i].w, [[79, 0.63], [52, 0.37]])
            assert.ok(d <= Math.max(10 * e[0].h, 1e-14), `h=${e[0].h} d=${d}`)
        })
    })

    //spec: JSDoc可內插範圍(3): limitInsideHull為false時投影至最近之凸包邊, 以該邊兩端點依投影位置線性分配權重
    it(`limitInsideHull為false: (600,500)投影至凸包邊(537,368)-(1151,371), 值等於兩端點之線性; 預設為null`, function() {
        let ax = 537
        let ay = 368
        let bx = 1151
        let by = 371
        let t = ((600 - ax) * (bx - ax) + (500 - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)
        let o = run(psA, { x: 600, y: 500 }, { limitInsideHull: false })
        assert.strict.equal(o.info[0].method, 'projection')
        assert.ok(maxDiff(o.info[0].w, [[7, 1 - t], [8, t]]) <= 1e-12)
        assert.ok(Math.abs(o.z[0] - ((1 - t) * 249 + t * 86)) <= 1e-9)
        assert.strict.deepStrictEqual(interp2NaturalNeighbor(psA, { x: 600, y: 500 }), { x: 600, y: 500, z: null })
    })

    //spec: JSDoc可內插範圍(3): 不受正規化正方形之限制(1.1.27於正方形外一律為null)
    it(`limitInsideHull為false: 正方形外之點亦有值; (1243,1207)投影落於頂點(1151,371)而為其z; 遠點皆有值且只用最近凸包邊之端點`, function() {
        let qs = [{ x: 1243, y: 1207 }, { x: -5000, y: 187 }, { x: 600, y: 5000 }, { x: 5000, y: -5000 }]
        let o = run(psA, qs, { limitInsideHull: false })
        assert.strict.deepStrictEqual(o.errs, [])
        assert.strict.equal(o.info[0].method, 'projection')
        assert.ok(maxDiff(o.info[0].w, [[8, 1]]) <= 1e-15)
        assert.ok(Math.abs(o.z[0] - 86) <= 1e-12)
        let hull = new Set(hullOf(psA))
        qs.forEach((q, i) => {
            assert.strict.equal(typeof o.z[i], 'number')
            assert.ok(o.info[i].ps.length <= 2)
            for (let p of o.info[i].ps) {
                assert.ok(hull.has(p.indSrc), `i=${i} indSrc=${p.indSrc}`)
            }
        })
        let od = run(psA, qs)
        assert.strict.deepStrictEqual(od.z, [null, null, null, null])
        assert.strict.deepStrictEqual(od.info.map((v) => v.n), [0, 0, 0, 0])
    })

    //spec: 凸包內外連續(凸包內Sibson、凸包外投影於凸包邊上之極限皆為兩端點線性)
    it(`凸包各邊兩側(各離邊正方形邊長之1e-8倍)之權重差不大於1e-5`, function() {
        let hull = hullOf(psA)
        let side = 1130
        let qin = []
        let qout = []
        for (let i = 0; i < hull.length; i++) {
            let a = psA[hull[i]]
            let b = psA[hull[(i + 1) % hull.length]]
            let L = Math.hypot(b.x - a.x, b.y - a.y)
            let nx = -(b.y - a.y) / L //逆時針凸包之左側為內側
            let ny = (b.x - a.x) / L
            let mx = a.x + 0.37 * (b.x - a.x)
            let my = a.y + 0.37 * (b.y - a.y)
            let d = 1e-8 * side
            qin.push({ x: mx + d * nx, y: my + d * ny })
            qout.push({ x: mx - d * nx, y: my - d * ny })
        }
        let oi = run(psA, qin)
        let oo = run(psA, qout, { limitInsideHull: false })
        for (let i = 0; i < hull.length; i++) {
            assert.strict.equal(oi.info[i].method, 'sibson')
            assert.strict.equal(oo.info[i].method, 'projection')
            let d = maxDiff(oi.info[i].w, [...oo.info[i].w])
            assert.ok(d <= 1e-5, `edge ${i} d=${d}`)
        }
    })

})


describe(`interp2NaturalNeighbor 特例(同座標、重複點、共線、不足3點)與偵測之回呼`, function() {

    //spec: JSDoc可內插範圍(4): 與原始點同座標者該原始點權重1, 仍呼叫回呼
    it(`與原始點同座標: method為vertex, 回呼1次且只含該原始點(權重1), z同1.1.27(249)`, function() {
        let calls = []
        let r = interp2NaturalNeighbor(psA, { x: 537, y: 368 }, {
            funInterpFragment: (msg) => {
                calls.push(['frag', msg.indSrc, msg.areaRatio, msg.method])
                return msg.v
            },
            funInterpFragments: (msg) => {
                calls.push(['frags', msg.ps.length, msg.method])
                return msg.v
            },
        })
        assert.strict.deepStrictEqual(r, { x: 537, y: 368, z: 249 })
        assert.strict.deepStrictEqual(calls, [['frag', 7, 1, 'vertex'], ['frags', 1, 'vertex']])
    })

    //spec: JSDoc可內插範圍(5): 同座標之原始點只保留輸入順序最後一個參與內插, 其餘不出現在回呼中
    it(`重複來源點: 與第0點同座標而z=500之第10點, 同座標之查詢點為500; 附近之查詢點只用第10點, 與把第0點之z改為500之結果相同`, function() {
        let dup = [...psA, { x: 243, y: 206, z: 500 }]
        let o = run(dup, [{ x: 243, y: 206 }, { x: 243, y: 207 }, { x: 283, y: 207 }])
        assert.ok(Math.abs(o.z[0] - 500) <= 1e-12)
        assert.strict.deepStrictEqual([...o.info[0].w.keys()], [10])
        for (let i of [1, 2]) {
            assert.strict.equal(o.info[i].w.has(0), false)
            assert.strict.equal(o.info[i].w.has(10), true)
        }
        let rep = psA.map((p, i) => (i === 0 ? { ...p, z: 500 } : p))
        let o2 = run(rep, [{ x: 243, y: 207 }, { x: 283, y: 207 }])
        assert.ok(Math.abs(o.z[1] - o2.z[0]) <= 1e-9)
        assert.ok(Math.abs(o.z[2] - o2.z[1]) <= 1e-9)
        assert.ok(Math.abs(o.info[1].w.get(10) - o2.info[0].w.get(0)) <= 1e-15)
    })

    //spec: JSDoc可內插範圍(8): 重複之查詢座標各自計算, 每個indTar皆呼叫回呼
    it(`重複查詢點: 5點中第0與2點、第3與4點(與原始點同座標)同座標, 皆呼叫回呼且z相同`, function() {
        let ind = []
        let r = interp2NaturalNeighbor(psA, [{ x: 243, y: 207 }, { x: 600, y: 250 }, { x: 243, y: 207 }, { x: 537, y: 368 }, { x: 537, y: 368 }], {
            funInterpFragments: (msg) => {
                ind.push(msg.indTar)
                return msg.v
            },
        })
        assert.strict.deepStrictEqual(ind, [0, 1, 2, 3, 4])
        assert.strict.equal(r[0].z, r[2].z)
        assert.strict.equal(r[3].z, r[4].z)
    })

    //spec: JSDoc可內插範圍(6): 全部共線或不足3點, true時除同座標者外皆null; false時沿直線線性內插(method為line)
    it(`全部共線與不足3點: 預設為null(同座標者除外); false時沿直線線性內插`, function() {
        let line = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, { x: 2, y: 0, z: 3 }]
        assert.strict.deepStrictEqual(interp2NaturalNeighbor(line, [{ x: 0.5, y: 0 }, { x: 1, y: 0 }]), [{ x: 0.5, y: 0, z: null }, { x: 1, y: 0, z: 2 }])
        let o = run(line, [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 3, y: 0 }, { x: -1, y: 7 }], { limitInsideHull: false })
        assert.strict.deepStrictEqual(o.info.map((v) => v.method), ['line', 'line', 'line', 'line'])
        assertNear(o.r, [{ x: 0.5, y: 0, z: 1.5 }, { x: 0.5, y: 0.5, z: 1.5 }, { x: 3, y: 0, z: 3 }, { x: -1, y: 7, z: 1 }])
        let two = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 }]
        assertNear(interp2NaturalNeighbor(two, [{ x: 0.5, y: 0.4 }], { limitInsideHull: false }), [{ x: 0.5, y: 0.4, z: 1.45 }])
        assert.strict.deepStrictEqual(interp2NaturalNeighbor(two, [{ x: 0.5, y: 0.4 }]), [{ x: 0.5, y: 0.4, z: null }])
        let one = [{ x: 5, y: 5, z: 7 }, { x: 5, y: 5, z: 7 }]
        assertNear(interp2NaturalNeighbor(one, [{ x: 9, y: 1 }], { limitInsideHull: false }), [{ x: 9, y: 1, z: 7 }])
        assert.strict.deepStrictEqual(interp2NaturalNeighbor(one, [{ x: 9, y: 1 }, { x: 5, y: 5 }]), [{ x: 9, y: 1, z: null }, { x: 5, y: 5, z: 7 }])
    })

    //spec: JSDoc算法(4)與可內插範圍(7): 無法內插者回傳null並呼叫opt.funInterpError告知原因, 未給時以console.warn彙總, 不輸出未通過檢查之值
    it(`無法內插(座標範圍溢位)者為null並呼叫funInterpError; 未給funInterpError時console.warn彙總1次`, function() {
        let huge = [{ x: -1e308, y: 0, z: 1 }, { x: 1e308, y: 0, z: 2 }, { x: 0, y: 1e308, z: 3 }]
        let o = run(huge, [{ x: 0, y: -1e307 }, { x: 0, y: 5 }], { limitInsideHull: false })
        assert.strict.deepStrictEqual(o.z, [null, null])
        assert.strict.deepStrictEqual(o.errs.map((e) => [e.indTar, e.reason]), [[0, 'nonFiniteSourceCoordinate'], [1, 'nonFiniteSourceCoordinate']])
        assert.strict.deepStrictEqual(o.info.map((v) => v.n), [0, 0])
        let warns = []
        let saved = console.warn
        console.warn = (...args) => {
            warns.push(args.join(' '))
        }
        try {
            let r = interp2NaturalNeighbor(huge, [{ x: 0, y: -1e307 }, { x: 0, y: 5 }])
            assert.strict.deepStrictEqual(r.map((v) => v.z), [null, null])
        }
        finally {
            console.warn = saved
        }
        assert.strict.equal(warns.length, 1)
        assert.ok(warns[0].includes('2 point(s)'))
    })

    //spec: 不依賴robust-predicates之正負號慣例而實測(本函數於首次呼叫時校正); 此處記錄所裝版本之慣例並以已知結果核對
    it(`robust-predicates之正負號: 順、逆時針之orient2d異號, 外接圓內外之incircle異號; 本函數之結果與慣例無關`, function() {
        let o = Math.sign(orient2d(0, 0, 1, 0, 0, 1))
        assert.strict.equal(Math.sign(orient2d(0, 0, 0, 1, 1, 0)), -o)
        let i = Math.sign(incircle(0, 0, 1, 0, 0, 1, 0.25, 0.25))
        assert.strict.equal(Math.sign(incircle(0, 0, 1, 0, 0, 1, 2, 2)), -i)
        assert.strict.equal(Math.sign(incircle(0, 0, 0, 1, 1, 0, 0.25, 0.25)), -i)
        let r = run(mkGrid(), { x: 0.3125, y: 0.4375 })
        assert.ok(maxDiff(r.info[0].w, [[21, 0.25], [22, 0.25], [30, 0.25], [31, 0.25]]) <= 1e-15)
    })

})

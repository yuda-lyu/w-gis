import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { sibsonExact } from './tools/sibsonExactRef.mjs'


//規則帳本: sgud/rule/rulebook.md R-NN2(interp2NaturalNeighbor 凸包內之 Sibson 權重; 使用端 Gitea #145)
//判準: test/tools/sibsonExactRef.mjs(有理數半平面裁切, 以原始輸入之double為準, 與被測函數無共用程式)
//環境變數 W_GIS_SRC_DIR 可指定含 interp2NaturalNeighbor.mjs 之資料夾(對照修前碼或變異碼), 預設為本套件 src
let dirSrc = process.env.W_GIS_SRC_DIR ? path.resolve(process.env.W_GIS_SRC_DIR) : path.resolve('src')
let getFn = async () => {
    return (await import(pathToFileURL(path.join(dirSrc, 'interp2NaturalNeighbor.mjs')).href)).default
}

//rng, mulberry32(可重現之亂數)
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

//mk, 座標陣列轉原始點(z為指標)
let mk = (pts) => pts.map(([x, y], i) => ({ x, y, z: i }))

//run, 內插並以回呼取各點之權重(indSrc->areaRatio)、method、回呼次數與funInterpError
let run = (fn, src, qs, opt = {}) => {
    let info = qs.map(() => ({ n: 0, method: null, w: null }))
    let errs = []
    let r = fn(src, qs.map(([x, y]) => ({ x, y })), {
        ...opt,
        funInterpFragments: (msg) => {
            let o = info[msg.indTar]
            o.n++
            o.method = msg.method
            o.w = new Map(msg.ps.map((p) => [p.indSrc, p.areaRatio]))
            return msg.v
        },
        funInterpError: (e) => {
            errs.push(e)
        },
    })
    return { r, info, errs }
}

//maxDiff, 兩組權重逐原始點相減之最大絕對值(缺者視為0)
let maxDiff = (a, b) => {
    let keys = new Set([...a.keys(), ...b.keys()])
    let d = 0
    for (let k of keys) {
        d = Math.max(d, Math.abs((a.get(k) || 0) - (b.get(k) || 0)))
    }
    return d
}

//hullOf, 凸包(monotone chain, 逆時針)之座標
let hullOf = (pts) => {
    let p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
    let cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    let lo = []
    for (let v of p) {
        while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) {
            lo.pop()
        }
        lo.push(v)
    }
    let up = []
    for (let v of p.slice().reverse()) {
        while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) {
            up.pop()
        }
        up.push(v)
    }
    return lo.slice(0, -1).concat(up.slice(0, -1))
}
let insideOf = (h) => (x, y) => {
    for (let i = 0; i < h.length; i++) {
        let a = h[i]
        let b = h[(i + 1) % h.length]
        if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) <= 0) {
            return false
        }
    }
    return true
}

//checkAgainstRef, 每點: 有值且為有限數、回呼1次、method為sibson(或備援sibsonExact、或與原始點同座標之vertex)、無funInterpError、權重與精確解之差不大於tol
let checkAgainstRef = (fn, pts, qs, tol = 1e-12) => {
    let src = mk(pts)
    let o = run(fn, src, qs)
    assert.strict.deepStrictEqual(o.errs, [])
    let dmax = 0
    for (let i = 0; i < qs.length; i++) {
        let z = o.r[i].z
        assert.ok(typeof z === 'number' && Number.isFinite(z), `q=${qs[i]} z=${z}`)
        assert.strict.equal(o.info[i].n, 1, `q=${qs[i]}`)
        assert.ok(['sibson', 'sibsonExact', 'vertex'].includes(o.info[i].method), `q=${qs[i]} method ${o.info[i].method}`)
        let ref = sibsonExact(pts, qs[i])
        assert.ok(ref.ok, `ref q=${qs[i]}`)
        let d = maxDiff(o.info[i].w, ref.weights)
        dmax = Math.max(dmax, d)
        assert.ok(d <= tol, `q=${qs[i]} maxDiff ${d}`)
    }
    return dmax
}

let R = rng(20261114)
let p10 = [[243, 206], [233, 225], [21, 325], [953, 28], [1092, 290], [744, 200], [174, 3], [537, 368], [1151, 371], [814, 252]]
let p200 = []
for (let i = 0; i < 200; i++) {
    p200.push([R(), R()])
}
let h200 = hullOf(p200)


describe(`interp2NaturalNeighbor 參考解自身(test/tools/sibsonExactRef.mjs)`, function() {

    //spec: Sibson權重之定義(Liang & Hale 2010 §2.2): w_i = area(V(x)∩V(x_i))/area(V(x)); 參考解須先以不變量與解析解驗過才可當判準(role-researcher-for-calculation Step 4)
    it(`解析解: 正方形格之格心四點各0.25; 正三角形形心三點各1/3; 三角形內一次函數重現`, function() {
        let sq = [[0, 0], [1, 0], [1, 1], [0, 1], [2, 0], [2, 1], [0, 2], [1, 2], [2, 2]]
        let r = sibsonExact(sq, [0.5, 0.5], { formulaB: true, allSites: true })
        assert.ok(r.ok)
        assert.strict.deepStrictEqual([...r.weights.entries()].sort((a, b) => a[0] - b[0]), [[0, 0.25], [1, 0.25], [2, 0.25], [3, 0.25]])
        r = sibsonExact([[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], [0.5, Math.sqrt(3) / 6], { formulaB: true })
        assert.ok(r.ok)
        for (let w of r.weights.values()) {
            assert.ok(Math.abs(w - 1 / 3) <= 1e-12, `${w}`)
        }
        let t3 = [[0, 0], [10, 0], [0, 10]]
        r = sibsonExact(t3, [2, 2])
        let z = 0
        for (let [i, w] of r.weights) {
            z += w * (1 + 0.1 * t3[i][0] + 0.2 * t3[i][1])
        }
        assert.ok(Math.abs(z - 1.6) <= 1e-14, `${z}`)
    })

    //spec: 參考解之固定裁切框(opt.box, 重現1.1.27之正方形裁切用): 框足夠大時等於不裁切之結果; 框小時面積和仍等於總面積, 而局部座標性質不再成立(裁切所致)
    it(`固定裁切框: 大框之結果逐位元同不裁切; 小框(1.1.27之正方形)使三角形(2,2)之一次函數不再重現`, function() {
        let t3 = [[0, 0], [10, 0], [0, 10]]
        let a = sibsonExact(t3, [2, 2])
        let b = sibsonExact(t3, [2, 2], { box: [-1e6, -1e6, 1e6, 1e6] })
        assert.ok(a.ok && b.ok)
        assert.strict.deepStrictEqual([...b.weights.entries()].sort(), [...a.weights.entries()].sort())
        let c = sibsonExact(t3, [2, 2], { box: [0, -5, 10, 5].map((v, i) => (i % 2 ? v + 5 : v)) })
        assert.ok(c.ok && c.checks.sumEqTotal && !c.checks.localCoordZero)
        let z = 0
        for (let [i, w] of c.weights) {
            z += w * (1 + 0.1 * t3[i][0] + 0.2 * t3[i][1])
        }
        assert.ok(Math.abs(z - 1.6801980198019804) <= 1e-12, `${z}`) //等於1.1.27之裁切值
    })

    //spec: 不變量(精確, 有理數相等): Σa_i等於V(x)之面積, Σa_i(x_i-x)=0, 各a_i>0; 公式A(交集)與公式B(差集)相等; 只算自然鄰點候選與算全部原始點相同; 平移與2之冪次縮放後逐位元相同
    it(`不變量與公式A、B一致、平移與縮放不變: 隨機30組`, function() {
        let r = rng(12345)
        let dy = (v) => Math.round(v * 2 ** 30) / 2 ** 30
        let n = 0
        for (let it = 0; it < 30; it++) {
            let ps = []
            let k = 8 + Math.floor(r() * 15)
            for (let i = 0; i < k; i++) {
                ps.push([r(), r()])
            }
            let q = [dy(0.3 + 0.4 * r()), dy(0.3 + 0.4 * r())]
            let a = sibsonExact(ps, q, { formulaB: true })
            if (!a.inside) {
                continue
            }
            n++
            assert.ok(a.ok && a.checks.sumEqTotal && a.checks.localCoordZero && a.checks.allNonNeg && a.checks.formulaBEqual, JSON.stringify(a.checks))
            let b = sibsonExact(ps, q, { allSites: true })
            let c = sibsonExact(ps.map((p) => [p[0] * 8 + 1024, p[1] * 8 - 512]), [q[0] * 8 + 1024, q[1] * 8 - 512])
            assert.strict.deepStrictEqual([...b.weights.entries()].sort(), [...a.weights.entries()].sort())
            assert.strict.deepStrictEqual([...c.weights.entries()].sort(), [...a.weights.entries()].sort())
        }
        assert.ok(n >= 20, `n=${n}`)
    })

})


describe(`interp2NaturalNeighbor 凸包內之Sibson權重: 對抗案例與有理數精確解(原始座標)之差不大於1e-12`, function() {

    //spec: JSDoc 可內插範圍(1): 凸包內為未裁切之Sibson權重; 算法(1): 內部座標不捨入, 權重等同以原始座標計算

    it(`10點範例: 凸包內格點(含1.1.27裁切或交集失敗之點)`, async function() {
        let fn = await getFn()
        let ins = insideOf(hullOf(p10))
        let qs = []
        for (let i = 0; i <= 20; i++) {
            for (let j = 0; j <= 10; j++) {
                let x = 21 + 1130 * i / 20
                let y = 3 + 368 * j / 10
                if (ins(x, y)) {
                    qs.push([x, y])
                }
            }
        }
        qs.push([1050, 201], [700, 330], [1000, 330], [400, 300])
        checkAgainstRef(fn, p10, qs)
    })

    it(`200隨機點: 凸包內隨機60點`, async function() {
        let fn = await getFn()
        let ins = insideOf(h200)
        let qs = []
        while (qs.length < 60) {
            let x = R()
            let y = R()
            if (ins(x, y)) {
                qs.push([x, y])
            }
        }
        checkAgainstRef(fn, p200, qs)
    })

    it(`9x9格點(間距1/8)內插成細格: 恰在格線(三角網邊)上、格心(四點共圓之圓心)、對角線上之點`, async function() {
        let fn = await getFn()
        let g = []
        for (let i = 0; i <= 8; i++) {
            for (let j = 0; j <= 8; j++) {
                g.push([i / 8, j / 8])
            }
        }
        let qs = []
        for (let i = 1; i < 32; i += 2) {
            for (let j = 1; j < 32; j += 3) {
                qs.push([i / 32, j / 32])
            }
        }
        qs.push([5 / 16, 3 / 8], [5 / 16, 7 / 16], [9 / 32, 13 / 32])
        checkAgainstRef(fn, g, qs)
    })

    it(`7:1斜向格點, TWD97量級之大座標(x約2.5e5、y約2.7e6), 半格點`, async function() {
        let fn = await getFn()
        let g = []
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                g.push([250000 + (7 * i - j) * 3, 2700000 + (i + 7 * j) * 3])
            }
        }
        let qs = []
        for (let i = 3; i <= 15; i += 2) {
            for (let j = 3; j <= 15; j += 2) {
                qs.push([250000 + (7 * i / 2 - j / 2) * 3, 2700000 + (i / 2 + 7 * j / 2) * 3])
            }
        }
        checkAgainstRef(fn, g, qs)
    })

    it(`靠近三角網內部邊: 最近點對中點之法向偏移h由1e-2至0`, async function() {
        let fn = await getFn()
        let ins = insideOf(h200)
        let qs = []
        for (let h of [1e-2, 1e-5, 1e-8, 1e-11, 1e-14, 0]) {
            for (let k = 0; k < 6; k++) {
                let a = p200[(k * 31) % 200]
                let best = null
                for (let b of p200) {
                    let d = Math.hypot(b[0] - a[0], b[1] - a[1])
                    if (b !== a && (best === null || d < best.d)) {
                        best = { b, d }
                    }
                }
                let b = best.b
                let q = [(a[0] + b[0]) / 2 - (b[1] - a[1]) / best.d * h, (a[1] + b[1]) / 2 + (b[0] - a[0]) / best.d * h]
                if (ins(q[0], q[1])) {
                    qs.push(q)
                }
            }
        }
        checkAgainstRef(fn, p200, qs)
    })

    it(`靠近凸包邊(內側): h由1e-2至1e-15(正方形邊長之倍數)`, async function() {
        let fn = await getFn()
        let qs = []
        for (let h of [1e-2, 1e-6, 1e-9, 1e-12, 1e-15]) {
            for (let i = 0; i < h200.length; i += 3) {
                let a = h200[i]
                let b = h200[(i + 1) % h200.length]
                let dx = b[0] - a[0]
                let dy = b[1] - a[1]
                let L = Math.hypot(dx, dy)
                qs.push([a[0] + 0.4 * dx - dy / L * h, a[1] + 0.4 * dy + dx / L * h])
            }
        }
        checkAgainstRef(fn, p200, qs)
    })

    it(`極小群: 群半徑為範圍之1e-5至1e-13(三角網須翻邊修正或以掃描線法重建), 群內之內插點`, async function() {
        let fn = await getFn()
        for (let rc of [1e-5, 1e-9, 1e-11, 1e-13]) {
            let r = rng(31337)
            let src = p200.slice(0, 50).map((p) => [p[0], p[1]])
            let cs = [[0.3, 0.7], [0.62, 0.41], [0.81, 0.33]]
            for (let c of cs) {
                for (let k = 0; k < 10; k++) {
                    src.push([c[0] + rc * (r() - 0.5), c[1] + rc * (r() - 0.5)])
                }
            }
            let qs = []
            for (let c of cs) {
                for (let k = 0; k < 4; k++) {
                    qs.push([c[0] + rc * 0.6 * (r() - 0.5), c[1] + rc * 0.6 * (r() - 0.5)])
                }
            }
            checkAgainstRef(fn, src, qs)
        }
    })

    //spec: JSDoc 算法(1): delaunator之結果有反向三角形而翻邊修復不了時, 改以掃描線法重建後再翻邊; 此組(3群各30點、群半徑1e-11, 另60點)之delaunator結果須重建
    it(`極小群(群半徑1e-11, 各群30點): delaunator之三角網有反向三角形, 須以掃描線法重建; 群中心附近之點`, async function() {
        let fn = await getFn()
        let r = rng(31337)
        let src = []
        for (let c of [[0.3, 0.7], [0.62, 0.41], [0.81, 0.83]]) {
            for (let i = 0; i < 30; i++) {
                src.push([c[0] + 1e-11 * (r() - 0.5), c[1] + 1e-11 * (r() - 0.5)])
            }
        }
        for (let i = 0; i < 60; i++) {
            src.push([r(), r()])
        }
        checkAgainstRef(fn, src, [[0.2999999999999992, 0.6999999999981283], [0.620000000000104, 0.4100000000001641], [0.8100000000011595, 0.8299999999987916], [0.4, 0.45]])
    })

    it(`凸包底邊21點近乎共線(凸出1e-9、1e-15), 外心極遠`, async function() {
        let fn = await getFn()
        for (let bump of [1e-9, 1e-15]) {
            let r = rng(4711)
            let src = []
            for (let i = 0; i <= 20; i++) {
                let x = i / 20
                src.push([x, -bump * 4 * x * (1 - x)])
            }
            for (let i = 0; i < 60; i++) {
                src.push([r(), 0.02 + 0.98 * r()])
            }
            src.push([0, 1], [1, 1])
            let qs = []
            for (let k = 0; k < 10; k++) {
                qs.push([0.02 + 0.96 * r(), 1e-3 * r() + 1e-6])
            }
            checkAgainstRef(fn, src, qs)
        }
    })

    it(`靠近原始點(距離1e-3至1e-15)與兩原始點極近(相距2^-52至1e-4)`, async function() {
        let fn = await getFn()
        let ins = insideOf(h200)
        let qs = []
        for (let d of [1e-3, 1e-8, 1e-12, 1e-15]) {
            for (let k = 0; k < 5; k++) {
                let p = p200[(k * 13) % 200]
                let q = [p[0] + d * Math.cos(k), p[1] + d * Math.sin(k)]
                if (ins(q[0], q[1])) {
                    qs.push(q)
                }
            }
        }
        checkAgainstRef(fn, p200, qs)
        for (let sep of [2 ** -52, 1e-14, 1e-8, 1e-4]) {
            let src = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.5 + sep, 0.5], [0.3, 0.7], [0.71, 0.33]]
            checkAgainstRef(fn, src, [[0.5 + sep / 2, 0.5 + sep / 3], [0.5 + sep / 2, 0.5 - sep], [0.4, 0.45], [0.5 - sep, 0.5 + sep]])
        }
    })

    it(`共圓: 正4、8、16邊形之中心與近中心`, async function() {
        let fn = await getFn()
        for (let nv of [4, 8, 16]) {
            let src = []
            for (let k = 0; k < nv; k++) {
                src.push([Math.cos(2 * Math.PI * k / nv), Math.sin(2 * Math.PI * k / nv)])
            }
            src.push([2, 2], [-2, 2], [2, -2], [-2, -2])
            checkAgainstRef(fn, src, [[0, 0], [1e-12, 0], [1e-6, 1e-7], [0.1, 0.05]])
        }
    })

    //spec: JSDoc 算法(1): 2之冪次縮放不捨入(範圍為次正規數時亦然)
    it(`原始點座標範圍為次正規數(約1e-310): 權重與座標放大2^1000後相同`, async function() {
        let fn = await getFn()
        let s = 2 ** -1030
        let pts = [[0, 0], [5 * s, 0], [0, 5 * s], [5 * s, 5 * s], [2 * s, 3 * s]]
        let qs = [[s, s], [3 * s, 2 * s]]
        let a = run(fn, mk(pts), qs)
        let b = run(fn, mk(pts.map(([x, y]) => [x * 2 ** 1000, y * 2 ** 1000])), qs.map(([x, y]) => [x * 2 ** 1000, y * 2 ** 1000]))
        assert.strict.deepStrictEqual(a.errs, [])
        for (let i = 0; i < qs.length; i++) {
            assert.ok(a.info[i].w !== null, `i=${i} null`)
            assert.strict.deepStrictEqual([...a.info[i].w.entries()], [...b.info[i].w.entries()], `i=${i}`)
        }
    })

    //spec: JSDoc 算法(1): 內部座標之平移與縮放不捨入, 故結果與原始座標之平移(精確者)與2之冪次縮放無關
    it(`平移(精確可表示者)與2之冪次縮放: 權重逐位元相同`, async function() {
        let fn = await getFn()
        let src = mk(p10)
        let qs = [[243, 207], [1050, 201], [700, 330], [400, 300]]
        let a = run(fn, src, qs)
        for (let [sx, ox, oy] of [[1, 1048576, -2097152], [2 ** -20, 0, 0], [2 ** 30, 3 * 2 ** 40, 2 ** 41]]) {
            let b = run(fn, src.map((p) => ({ x: p.x * sx + ox, y: p.y * sx + oy, z: p.z })), qs.map(([x, y]) => [x * sx + ox, y * sx + oy]))
            for (let i = 0; i < qs.length; i++) {
                assert.strict.deepStrictEqual([...b.info[i].w.entries()], [...a.info[i].w.entries()], `sx=${sx} i=${i}`)
            }
        }
    })

})


describe(`interp2NaturalNeighbor 1.1.27之三個原因(修前紅)`, function() {

    //spec: JSDoc 算法(3): 不裁切、不作多邊形交集; 可內插範圍(1)
    it(`③正方形裁切: 三角形(0,0)(10,0)(0,10)、z=1+0.1x+0.2y之(2,2)為1.6(1.1.27為1.68); 10點範例(1050,201)為141.5637(1.1.27為106.116)`, async function() {
        let fn = await getFn()
        let r = fn([{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }], { x: 2, y: 2 })
        assert.ok(Math.abs(r.z - 1.6) <= 1e-12, `${r.z}`)
        let ps = p10.map(([x, y], i) => ({ x, y, z: [95, 146, 22, 223, 39, 191, 22, 249, 86, 125][i] }))
        r = fn(ps, { x: 1050, y: 201 })
        assert.ok(Math.abs(r.z - 141.56369998885097) <= 1e-12 * 141.56, `${r.z}`)
    })

    //spec: JSDoc 算法(1)(3): 不依d3-delaunay之絕對門檻(|2倍有號面積|<1e-9視為退化)
    it(`②小三角形群: (0.500003,0.500003)之後三點權重為0.4、0.3、0.3(1.1.27為0、0、1), 內插值等於一次函數`, async function() {
        let fn = await getFn()
        let pts = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.50001, 0.5], [0.5, 0.50001]]
        let o = run(fn, pts.map(([x, y]) => ({ x, y, z: 1 + 2 * x + 3 * y })), [[0.500003, 0.500003]])
        let w = o.info[0].w
        assert.ok(Math.abs(w.get(4) - 0.4) <= 1e-9 && Math.abs(w.get(5) - 0.3) <= 1e-9 && Math.abs(w.get(6) - 0.3) <= 1e-9, JSON.stringify([...w]))
        assert.ok(Math.abs(o.r[0].z - 3.500015) <= 1e-12, `${o.r[0].z}`)
        let ref = sibsonExact(pts, [0.500003, 0.500003])
        assert.ok(maxDiff(w, ref.weights) <= 1e-12)
    })

    //spec: JSDoc 算法(4): 不以「失敗記0再等比放大」輸出; 1.1.27之polybooljs(絕對容許值1e-12)於群內多邊形拋錯被吞, 該鄰點權重為0、其餘等比放大
    it(`①交集失敗被吞: 群半徑1e-5之小群內之點, 權重與精確解相同(1.1.27最大差近1)`, async function() {
        let fn = await getFn()
        let r = rng(99)
        let src = []
        for (let i = 0; i < 40; i++) {
            src.push([r() * 1000, r() * 1000])
        }
        let c = [300, 300]
        for (let k = 0; k < 6; k++) {
            let a = 2 * Math.PI * k / 6 + 0.3
            src.push([c[0] + 0.01 * Math.cos(a), c[1] + 0.01 * Math.sin(a)])
        }
        let qs = []
        for (let k = 0; k < 8; k++) {
            qs.push([c[0] + 0.008 * (r() - 0.5), c[1] + 0.008 * (r() - 0.5)])
        }
        checkAgainstRef(fn, src, qs)
    })

})


describe(`interp2NaturalNeighbor 回呼之ps只列權重大於0者`, function() {

    //spec: JSDoc 可內插範圍(9): 回呼之ps只列權重大於0之原始點(如投影落於凸包頂點者只有1個)
    it(`limitInsideHull為false: 投影落於凸包頂點(1151,371)者ps只有該頂點(權重1); 凸包外容許值內而投影落於頂點者亦然`, async function() {
        let fn = await getFn()
        let ps = p10.map(([x, y], i) => ({ x, y, z: i }))
        let o = run(fn, ps, [[1243, 1207], [1151 + 2e-7, 371 + 1e-7]], { limitInsideHull: false })
        assert.strict.deepStrictEqual([...o.info[0].w.entries()], [[8, 1]])
        assert.strict.equal(o.info[0].method, 'projection')
        assert.strict.deepStrictEqual([...o.info[1].w.entries()], [[8, 1]])
        assert.strict.equal(o.info[1].method, 'hullEdge')
    })

    //spec: JSDoc 可內插範圍(2)(3): 容許值為至凸包之(歐氏)距離; 銳角頂點之外不因「至各邊所在直線之距離」小而被當作容許值內(外審 Argon 之線索)
    it(`銳角凸包頂點之外: 針狀三角形頂點外0.05與夾角1e-4之頂點外1e-5, true時為null、false時為投影; 頂點外1e-10(容許值內)為hullEdge`, async function() {
        let fn = await getFn()
        let needle = [[-1e-8, 0], [1e-8, 0], [0, 1]]
        let o = run(fn, needle.map(([x, y], i) => ({ x, y, z: [0, 0, 100][i] })), [[0, 1.05], [0, 1 + 1e-10]])
        assert.strict.equal(o.r[0].z, null)
        assert.strict.equal(o.info[0].n, 0)
        assert.strict.equal(o.info[1].method, 'hullEdge')
        let sharp = [[0, 0], [1, 0], [0, 1e-4]].map(([x, y], i) => ({ x, y, z: [0, 100, 50][i] }))
        o = run(fn, sharp, [[1 + 1e-5, 0]])
        assert.strict.equal(o.r[0].z, null)
        o = run(fn, sharp, [[1 + 1e-5, 0]], { limitInsideHull: false })
        assert.strict.equal(o.info[0].method, 'projection')
        assert.ok(Math.abs(o.r[0].z - 100) <= 1e-9, `${o.r[0].z}`)
    })

    //spec: JSDoc 可內插範圍(2): 凸包邊上依投影位置線性分配權重; 極短之邊(近原點, 長度之平方下溢)亦同
    it(`極短凸包邊(長度1e-170至1e-300, 近原點): 邊之中點為兩端點各0.5, 外側容許值內之點依投影位置`, async function() {
        let fn = await getFn()
        for (let sep of [1e-170, 1e-300]) {
            let src = [{ x: 0, y: 0, z: 0 }, { x: sep, y: 0, z: 100 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]
            let o = run(fn, src, [[sep / 2, 0], [sep / 4, -sep]])
            assert.strict.deepStrictEqual(o.r.map((v) => v.z), [50, 25], `sep=${sep}`)
            assert.strict.deepStrictEqual([...o.info[0].w.entries()].sort(), [[0, 0.5], [1, 0.5]])
        }
    })

})


describe(`interp2NaturalNeighbor 回呼、選項與查詢點之例外(外審 agy-hydrogen 指出之漏測)`, function() {

    let ps = p10.map(([x, y], i) => ({ x, y, z: [95, 146, 22, 223, 39, 191, 22, 249, 86, 125][i] }))

    //spec: JSDoc 可內插範圍(12): 回呼拋錯時該點null並console.log; 回傳非有限數(NaN、Infinity、null、字串)時該點null; 其餘點照常
    it(`funInterpFragment、funInterpFragments拋錯或回傳非有限數: 該點為null, 其餘點照常`, async function() {
        let fn = await getFn()
        let logOri = console.log
        let logs = []
        try {
            console.log = (...a) => logs.push(a.join(' '))
            let qs = [{ x: 243, y: 207 }, { x: 600, y: 250 }]
            let r = fn(ps, qs, {
                funInterpFragment: (m) => {
                    if (m.indTar === 0) throw new Error('frag'); return m.v
                }
            })
            assert.strict.equal(r[0].z, null)
            assert.ok(Number.isFinite(r[1].z))
            assert.ok(logs.length >= 1)
            r = fn(ps, qs, {
                funInterpFragments: (m) => {
                    if (m.indTar === 0) throw new Error('frags'); return m.v
                }
            })
            assert.strict.equal(r[0].z, null)
            assert.ok(Number.isFinite(r[1].z))
            for (let bad of [NaN, Infinity, -Infinity, null, 'a']) {
                r = fn(ps, qs, { funInterpFragments: (m) => (m.indTar === 0 ? bad : m.v) })
                assert.strict.equal(r[0].z, null, `frags ${bad}`)
                assert.ok(Number.isFinite(r[1].z))
                r = fn(ps, qs, { funInterpFragment: (m) => (m.indTar === 0 ? bad : m.v) })
                assert.strict.equal(r[0].z, null, `frag ${bad}`)
                assert.ok(Number.isFinite(r[1].z))
            }
        }
        finally {
            console.log = logOri
        }
    })

    //spec: JSDoc @param opt.funInterpError(F1): 非函數視為未給(改以console.warn彙總); 拋錯時以console.log輸出後續行
    it(`funInterpError非函數視為未給(console.warn彙總一次); funInterpError拋錯時照常回傳其他點`, async function() {
        let fn = await getFn()
        let warnOri = console.warn
        let logOri = console.log
        let warns = []
        let logs = []
        try {
            console.warn = (...a) => warns.push(a.join(' '))
            console.log = (...a) => logs.push(a.join(' '))
            let qs = [{ x: 243, y: 207 }, { x: Infinity, y: 207 }]
            for (let v of ['f', 1, {}, null]) {
                warns = []
                let r = fn(ps, qs, { funInterpError: v })
                assert.strict.equal(r[1].z, null)
                assert.strict.equal(warns.length, 1, `funInterpError=${v}`)
                assert.ok(warns[0].includes('nonFiniteCoordinate:1'), warns[0])
            }
            warns = []
            let r = fn(ps, qs, {
                funInterpError: () => {
                    throw new Error('cb')
                }
            })
            assert.ok(Number.isFinite(r[0].z))
            assert.strict.equal(r[1].z, null)
            assert.strict.equal(warns.length, 0)
            assert.ok(logs.length >= 1)
        }
        finally {
            console.warn = warnOri
            console.log = logOri
        }
    })

    //spec: JSDoc 可內插範圍(10): indTar為psTar中x、y皆為數字之有效點依原順序之指標(無效點略過, 同1.1.27); (7)座標非有限數者null並告知
    it(`查詢點陣列含無效點: 非數字者略過(輸出不含), Infinity者為null並告知nonFiniteCoordinate`, async function() {
        let fn = await getFn()
        let errs = []
        let r = fn(ps, [{ x: 243, y: 207 }, { x: NaN, y: 207 }, { x: 'a', y: 207 }, { x: Infinity, y: 207 }, { x: 283, y: 207 }], { funInterpError: (e) => errs.push(e) })
        assert.strict.equal(r.length, 3)
        assert.strict.deepStrictEqual(r.map((v) => v.x), [243, Infinity, 283])
        assert.strict.equal(r[1].z, null)
        assert.ok(Number.isFinite(r[0].z) && Number.isFinite(r[2].z))
        assert.strict.deepStrictEqual(errs.map((e) => [e.indTar, e.reason]), [[1, 'nonFiniteCoordinate']])
    })

    //spec: JSDoc @param opt.scale: 非正數或非有限數視為未給(K3), 權重與內插值不受scale影響
    it(`opt.scale為0、負數、NaN、Infinity時視為未給(不拋錯), 結果等於預設`, async function() {
        let fn = await getFn()
        let base = fn(ps, { x: 600, y: 250 })
        for (let sc of [0, -1, NaN, Infinity, -Infinity, '0']) {
            let r = fn(ps, { x: 600, y: 250 }, { scale: sc })
            assert.strict.deepStrictEqual(r, base, `scale=${sc}`)
        }
    })

    //spec: JSDoc 可內插範圍(3)(13): 極遠之內插點(座標達1e156至1.5e308)不得誤判為凸包內; true為null且不告知, false為投影值
    it(`極遠之內插點(1e156至1.5e308): true時null且不告知, false時有值(投影)且不告知`, async function() {
        let fn = await getFn()
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }]
        for (let m of [1e156, 1e200, 1.5e308]) {
            let errs = []
            let r = fn(tri, [{ x: m, y: m }, { x: -m, y: 5 }], { funInterpError: (e) => errs.push(e) })
            assert.strict.deepStrictEqual(r.map((v) => v.z), [null, null])
            r = fn(tri, [{ x: m, y: m }, { x: -m, y: 5 }], { limitInsideHull: false, funInterpError: (e) => errs.push(e) })
            assert.ok(r.every((v) => Number.isFinite(v.z)), JSON.stringify(r))
            assert.strict.equal(r[1].z, 2) //(-m,5)投影至左邊(0,0)-(0,10)之中點: z為1與3之平均
            assert.strict.deepStrictEqual(errs, [], `m=${m}`)
        }
    })

})


describe(`interp2NaturalNeighbor 浮點檢查不過時之精確備援與告知`, function() {

    //內插點位於相距約1e-8之兩原始點之間, 新區塊極狹長: 浮點外心之誤差相對於遠方鄰點之被奪面積超過容許值(被奪面積為負), 改以有理數精確算法
    let fx = [[0, 0], [1, 0], [1, 1], [0, 1], [0.899872, 0.923733], [0.479653, 0.17841], [0.626145, 0.185699], [0.738854, 0.495936], [0.744373, 0.987572], [0.575891, 0.627936], [0.40776, 0.314366], [0.112417, 0.954943], [0.120513, 0.515946], [0.243849, 0.723545], [0.2438490000090267, 0.7235449999956967], [0.24384900000201898, 0.7235450000045742]]
    let fq = [0.24384900000420515, 0.7235449999979952]

    //spec: JSDoc 算法(4): 面積或權重之檢查不過者改以有理數精確算法重算, method為'sibsonExact'
    it(`狹長新區塊: method為sibsonExact, 權重與精確解之差不大於1e-15, 不告知錯誤`, async function() {
        let fn = await getFn()
        let o = run(fn, mk(fx), [fq])
        assert.strict.deepStrictEqual(o.errs, [])
        assert.strict.equal(o.info[0].method, 'sibsonExact')
        let ref = sibsonExact(fx, fq)
        assert.ok(maxDiff(o.info[0].w, ref.weights) <= 1e-15)
    })

    //spec: JSDoc 算法(4): 局部座標偏離以局部尺度(Σwi|pi-x|)正規化; 內插點夾於極近兩點之間時(新區塊極狹長), 浮點結果通不過即改以精確算法, 不輸出失準之權重(外審 terra 縮小之反例)
    it(`夾於極近兩點之間: 4點(兩點相距約1e-13)與11點(兩點相距約1e-5)之案例, 權重與精確解之差不大於1e-12`, async function() {
        let fn = await getFn()
        let p4 = [[0, 0], [0.765206954209134, 0.341522931586951], [0.6076439039781689, 0.6581236399710179], [0.6076439039781238, 0.6581236399709286]]
        checkAgainstRef(fn, p4, [[0.6076439039781464, 0.6581236399709732]])
        let p11 = [[0, 0], [1, 0], [1, 1], [0, 1], [0.7965524171013385, 0.6481435783207417], [0.42577230534516275, 0.8826226298697293], [0.6690518839750439, 0.82324153278023], [0.3484189852606505, 0.347508957143873], [0.5829578780103475, 0.19796314649283886], [0.7739871723577381, 0.7869231421500444], [0.7739922644793341, 0.7869317485603096]]
        checkAgainstRef(fn, p11, [[0.7739900642638013, 0.7869280299025383]])
    })

    //spec: JSDoc 算法(4): 條件估計(衝突三角形外接圓半徑平方和相對於總面積)超過容許值者改以精確算法; 傾斜之極狹長點群(寬長比1e-4、1e-6)中之點(外審 agy-hydrogen 之反例)
    it(`傾斜之極狹長點群(寬長比1e-4、1e-6)中之點: 權重與精確解之差不大於1e-12`, async function() {
        let fn = await getFn()
        let s4 = [[0, 0], [0.8, 0.6], [0.7999400000000001, 0.60008], [-0.00006, 0.00008], [0.15245017559160295, 0.1143505345299244], [0.529204388657611, 0.3969660444234461], [0.46203146344301854, 0.3466015395364463], [0.29074230156154185, 0.21808862010309102], [0.2579684950027243, 0.19353526848211886], [0.578648835758254, 0.4340707906676531]]
        checkAgainstRef(fn, s4, [[0.6879842036672235, 0.5160918850714564]])
        let s6 = [[0, 0], [0.8, 0.6], [0.7999994, 0.6000008], [-6e-7, 8e-7], [0.3333320997332664, 0.24999954301199898], [0.14247751283154877, 0.10685850616950467], [0.1502849229919425, 0.11271399528648973], [0.32427717268788336, 0.24320815455981748], [0.703592041369895, 0.5276946247215143], [0.28128217645016457, 0.21096241169883623]]
        checkAgainstRef(fn, s6, [[0.5882546196272112, 0.4411912358614953]])
        //寬長比約1e-7之狹長帶: 條件估計未超過容許值, 由局部尺度之局部座標檢查攔下(若改以最遠鄰點距離正規化則差5.1e-11)
        let s7 = [[0, 0], [-0.5742857833070291, 0.818654896211726], [-0.5742858651725187, 0.8186548387831477], [-8.18654896211726e-8, -5.7428578330702907e-8], [-0.2783404710572826, 0.39677931937385263], [-0.2557289089349221, 0.3645460800882617], [-0.17473008902399506, 0.24908077346332322], [-0.15907621195491348, 0.22676597348881802], [-0.027971121123815113, 0.039873210574328195], [-0.007560874167278367, 0.010778034364011794], [-0.2610969156421141, 0.3721983273237184], [-0.41137692614893784, 0.5864252060291538]]
        checkAgainstRef(fn, s7, [[-0.4688609661130966, 0.6683697820394875]])
    })

    //spec: JSDoc 算法(4): 仍不過(或執行環境不支援BigInt)則回傳null、不呼叫funInterpFragment(s)、呼叫funInterpError; 未給時console.warn彙總一次且只含點數與原因代碼
    it(`執行環境不支援BigInt: 該點為null並呼叫funInterpError(reason含exact:unavailable); 未給funInterpError時console.warn一次且不含座標`, async function() {
        let fn = await getFn()
        let BigIntOri = globalThis.BigInt
        let warns = []
        let warnOri = console.warn
        try {
            globalThis.BigInt = undefined
            let o = run(fn, mk(fx), [fq, [0.5, 0.5]])
            assert.strict.equal(o.r[0].z, null)
            assert.strict.equal(o.info[0].n, 0)
            assert.strict.equal(o.errs.length, 1)
            assert.strict.equal(o.errs[0].indTar, 0)
            assert.strict.equal(o.errs[0].x, fq[0])
            assert.strict.equal(o.errs[0].y, fq[1])
            assert.ok(o.errs[0].reason.includes('exact:unavailable'), o.errs[0].reason)
            assert.ok(Number.isFinite(o.r[1].z))
            console.warn = (...a) => warns.push(a.join(' '))
            let r = fn(mk(fx), [{ x: fq[0], y: fq[1] }, { x: 0.5, y: 0.5 }])
            assert.strict.equal(r[0].z, null)
            assert.strict.equal(warns.length, 1)
            assert.ok(/1 point\(s\)/.test(warns[0]) && warns[0].includes('exact:unavailable'), warns[0])
            assert.ok(!warns[0].includes(String(fq[0]).slice(0, 8)), warns[0])
        }
        finally {
            globalThis.BigInt = BigIntOri
            console.warn = warnOri
        }
    })

    //spec: JSDoc 算法(4): 不用BigInt字面值, 不支援BigInt之環境仍可載入本套件
    it(`原始碼不含BigInt字面值(如0n)`, function() {
        let code = fs.readFileSync(path.join(dirSrc, 'interp2NaturalNeighbor.mjs'), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
        assert.ok(!/\b\d+n\b/.test(code), (code.match(/.{0,30}\b\d+n\b.{0,10}/) || [''])[0])
    })

})

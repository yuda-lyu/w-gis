// 獨立參考解: Sibson 權重之有理數(BigInt)精確解, 以半平面裁切直接求 Voronoi 區塊(不經三角網、不經外心)
// 公式A(交集): a_i = area( V(q) ∩ V_old(p_i) ), V(q) = box ∩_{j} {z: |z-q| <= |z-p_j|}, V_old(p_i) = ∩_{j!=i} {|z-p_i| <= |z-p_j|}
// 公式B(差集): a_i = area( V_old(p_i) ∩ box ) - area( V_new(p_i) ∩ box ), V_new(p_i) = V_old(p_i) ∩ {|z-p_i| <= |z-q|}
// 兩式只共用「以直線裁切凸多邊形」之原語; 另以精確不變量檢查: Σa_i == area(V(q)) (公式A), Σa_i(p_i-q) == 0
// 座標: 輸入double先精確轉為 2^K 倍之整數(同一K), 全部運算為整數或有理數
// 用途: interp2NaturalNeighbor 之測試以本檔為獨立判準(與被測函數之三角網、外心、Liang & Hale 算法無共用程式); 以原始輸入之double為準(不經被測函數之座標轉換)
// 本檔之自我檢查見 test/unit-interp2NaturalNeighborSibson.test.mjs〈參考解自身〉; opt.box 為固定裁切框(供重現 1.1.27 之正方形裁切), opt.formulaB 另以公式B比對, opt.allSites 計算全部原始點(非只自然鄰點候選);
// 回傳之 areasRational 為各原始點之有理數被奪面積(供以有理數精確計算內插值), total 為其和
// 限制: 外框放大上限為範圍之 2^152 倍, 極貼近凸包邊(區塊大於此)者回 boxExhausted; 座標轉為 2^K 倍整數, 次正規數亦精確

let decomp = (x) => {
    if (x === 0) return [0n, 0]
    let dv = new DataView(new ArrayBuffer(8))
    dv.setFloat64(0, x)
    let hi = dv.getUint32(0)
    let lo = dv.getUint32(4)
    let neg = (hi >>> 31) === 1
    let ex = (hi >>> 20) & 0x7ff
    let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo)
    let e
    if (ex === 0) {
        e = -1074
    }
    else {
        mant |= (1n << 52n); e = ex - 1075
    }
    return [neg ? -mant : mant, e]
}

export let toInts = (vals) => {
    let ds = vals.map((v) => {
        if (!Number.isFinite(v)) throw new Error('non-finite')
        return decomp(v)
    })
    let K = 0
    for (let d of ds) if (d[0] !== 0n && -d[1] > K) K = -d[1]
    let ints = ds.map((d) => (d[0] === 0n ? 0n : (d[1] + K >= 0 ? d[0] << BigInt(d[1] + K) : d[0] >> BigInt(-(d[1] + K)))))
    return { K, ints }
}

let babs = (a) => (a < 0n ? -a : a)
let gcd = (a, b) => {
    a = babs(a); b = babs(b); while (b) {
        [a, b] = [b, a % b]
    } return a
}
let qn = (n, d) => {
    if (d < 0n) {
        n = -n; d = -d
    } let g = gcd(n, d); if (g > 1n) {
        n /= g; d /= g
    } return [n, d]
}
let qadd = (a, b) => qn(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
let qsub = (a, b) => qn(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
let qmul = (a, b) => qn(a[0] * b[0], a[1] * b[1])
export let qToNum = (a) => {
    let [n, d] = a
    if (n === 0n) return 0
    let neg = (n < 0n) !== (d < 0n)
    n = babs(n); d = babs(d)
    let sh = d.toString(2).length - n.toString(2).length + 90
    let q = sh >= 0 ? (n << BigInt(sh)) / d : n / (d << BigInt(-sh))
    let v = Number(q)
    let e = -sh
    while (e > 1000) {
        v *= 2 ** 1000; e -= 1000
    }
    while (e < -1000) {
        v *= 2 ** -1000; e += 1000
    }
    v *= 2 ** e
    return neg ? -v : v
}

// 直線 {a,b,c}: 半平面 a*x + b*y <= c (整數係數)
// 凸多邊形: 直線之循環序列 L0..Lm-1, 頂點 Vi = Li ∩ L(i+1), 齊次 [X,Y,W]
let meet = (L1, L2) => {
    let W = L1.a * L2.b - L2.a * L1.b
    let X = L1.c * L2.b - L2.c * L1.b
    let Y = L1.a * L2.c - L2.a * L1.c
    return [X, Y, W]
}
let side = (H, V) => {
    // sign(a x + b y - c), V=[X,Y,W]
    let s = H.a * V[0] + H.b * V[1] - H.c * V[2]
    let sg = s === 0n ? 0 : (s > 0n ? 1 : -1)
    return V[2] > 0n ? sg : -sg
}
let clip = (lines, H) => {
    let m = lines.length
    if (m === 0) return []
    let vs = []
    for (let i = 0; i < m; i++) {
        let V = meet(lines[i], lines[(i + 1) % m])
        if (V[2] === 0n) throw new Error('parallel consecutive lines')
        vs.push(V)
    }
    let ins = vs.map((V) => side(H, V) <= 0)
    if (ins.every((v) => v)) return lines
    if (ins.every((v) => !v)) return []
    let out = []
    for (let i = 0; i < m; i++) {
        // 邊 i 在直線 lines[i] 上, 起點 V(i-1), 終點 V(i)
        let sIn = ins[(i + m - 1) % m]
        let eIn = ins[i]
        if (sIn && eIn) out.push(lines[i])
        else if (sIn && !eIn) {
            out.push(lines[i]); out.push(H)
        }
        else if (!sIn && eIn) out.push(lines[i])
    }
    //不去除重合之相鄰頂點(裁切線恰過頂點時產生零長邊): 鞋帶式對零長邊之貢獻為0, 不影響面積
    return out
}
let polyArea2 = (lines) => {
    // 2倍有號面積(有理數)
    let m = lines.length
    if (m < 3) return [0n, 1n]
    let vs = []
    for (let i = 0; i < m; i++) vs.push(meet(lines[i], lines[(i + 1) % m]))
    let acc = [0n, 1n]
    for (let i = 0; i < m; i++) {
        let P = vs[i]
        let Q = vs[(i + 1) % m]
        acc = qadd(acc, qn(P[0] * Q[1] - Q[0] * P[1], P[2] * Q[2]))
    }
    return acc
}
// |z-p|^2 <= |z-r|^2  <=>  2(r-p)·z <= |r|^2-|p|^2
let bis = (p, r) => ({ a: 2n * (r[0] - p[0]), b: 2n * (r[1] - p[1]), c: r[0] * r[0] + r[1] * r[1] - p[0] * p[0] - p[1] * p[1] })
let boxLines = (cx, cy, R) => [
    { a: 0n, b: -1n, c: -(cy - R) }, // y >= cy-R
    { a: 1n, b: 0n, c: cx + R }, // x <= cx+R
    { a: 0n, b: 1n, c: cy + R }, // y <= cy+R
    { a: -1n, b: 0n, c: -(cx - R) }, // x >= cx-R
]

// sites: [[x,y],...] (double), q: [x,y]; 同座標者只留最後一個
// 回傳 {ok, inside, weights: Map(siteIndex -> number), areasQ: Map(index -> [n,d]), total:[n,d], checks}
export let sibsonExact = (sites, q, opt = {}) => {
    let keep = new Map()
    sites.forEach((s, i) => keep.set(`${s[0]}|${s[1]}`, i))
    let idx = [...keep.values()].sort((a, b) => a - b)
    let vals = [q[0], q[1]]
    for (let i of idx) vals.push(sites[i][0], sites[i][1])
    if (opt.box) vals.push(...opt.box)
    let { ints } = toInts(vals)
    let Q = [ints[0], ints[1]]
    let P = idx.map((_, k) => [ints[2 + 2 * k], ints[3 + 2 * k]])
    let fixedBox = null
    if (opt.box) {
        let o = 2 + 2 * idx.length
        let [x0, y0, x1, y1] = ints.slice(o, o + 4)
        fixedBox = [{ a: 0n, b: -1n, c: -y0 }, { a: 1n, b: 0n, c: x1 }, { a: 0n, b: 1n, c: y1 }, { a: -1n, b: 0n, c: -x0 }]
    }
    for (let k = 0; k < P.length; k++) {
        if (P[k][0] === Q[0] && P[k][1] === Q[1]) {
            let w = new Map(); w.set(idx[k], 1)
            return { ok: true, vertex: true, weights: w }
        }
    }
    // box: 以資料範圍為基準逐次放大
    let xs = P.map((p) => p[0]).concat([Q[0]])
    let ys = P.map((p) => p[1]).concat([Q[1]])
    let mnx = xs.reduce((a, b) => (a < b ? a : b)); let mxx = xs.reduce((a, b) => (a > b ? a : b))
    let mny = ys.reduce((a, b) => (a < b ? a : b)); let mxy = ys.reduce((a, b) => (a > b ? a : b))
    let span = (mxx - mnx) > (mxy - mny) ? (mxx - mnx) : (mxy - mny)
    if (span === 0n) span = 1n
    let cx = (mnx + mxx) / 2n
    let cy = (mny + mxy) / 2n
    let maxGrow = fixedBox ? 0 : (opt.maxGrow ?? 6)
    for (let g = 0; g <= maxGrow; g++) {
        let R = span * (1n << BigInt(8 + 24 * g))
        let box = fixedBox || boxLines(cx, cy, R)
        let VQ = box
        let bQ = P.map((p) => bis(Q, p))
        for (let k = 0; k < P.length; k++) VQ = clip(VQ, bQ[k])
        let touchesBox = VQ.some((L) => box.includes(L))
        if (touchesBox && !fixedBox) continue
        if (VQ.length < 3) return { ok: false, inside: false, emptyInBox: true }
        let total = polyArea2(VQ)
        // 公式A
        let areasA = new Map()
        let sumA = [0n, 1n]
        let lcx = [0n, 1n]
        let lcy = [0n, 1n]
        // 自然鄰點候選: VQ 之邊所屬之 bisector(opt.allSites 時全部計算)
        for (let k = 0; k < P.length; k++) {
            if (!opt.allSites && !VQ.includes(bQ[k])) continue
            let poly = VQ
            for (let j = 0; j < P.length && poly.length > 0; j++) {
                if (j === k) continue
                poly = clip(poly, bis(P[k], P[j]))
            }
            let a = polyArea2(poly)
            if (a[0] !== 0n) {
                areasA.set(k, a)
                sumA = qadd(sumA, a)
                lcx = qadd(lcx, qmul(a, [P[k][0] - Q[0], 1n]))
                lcy = qadd(lcy, qmul(a, [P[k][1] - Q[1], 1n]))
            }
        }
        let checks = {
            sumEqTotal: qsub(sumA, total)[0] === 0n,
            localCoordZero: lcx[0] === 0n && lcy[0] === 0n,
            allNonNeg: [...areasA.values()].every((a) => a[0] > 0n),
        }
        // 公式B(可選)
        if (opt.formulaB) {
            let okB = true
            for (let k = 0; k < P.length; k++) {
                let old = box
                for (let j = 0; j < P.length; j++) {
                    if (j === k) continue
                    old = clip(old, bis(P[k], P[j]))
                }
                let nw = clip(old, bis(P[k], Q))
                let d = qsub(polyArea2(old), polyArea2(nw))
                let a = areasA.get(k) || [0n, 1n]
                if (qsub(d, a)[0] !== 0n) {
                    okB = false; break
                }
            }
            checks.formulaBEqual = okB
        }
        let weights = new Map()
        for (let [k, a] of areasA) weights.set(idx[k], qToNum(qn(a[0] * total[1], a[1] * total[0])))
        let okLc = fixedBox ? true : checks.localCoordZero //裁切後之量不具局部座標性質
        //areasRational: 各原始點之被奪面積(有理數[分子,分母], 2倍面積, 座標為2^K倍之整數), 與total同單位; 供以有理數精確計算內插值
        let areasRational = new Map()
        for (let [k, a] of areasA) areasRational.set(idx[k], a)
        return { ok: checks.sumEqTotal && okLc && checks.allNonNeg && (opt.formulaB ? checks.formulaBEqual : true), inside: true, weights, areasRational, total, checks }
    }
    //放大至上限仍觸及外框: 內插點在凸包外(區塊無界), 或極貼近凸包邊而區塊大於上限(span·2^152); 兩者於此不分辨, 不得當作「凸包外」之證據
    return { ok: false, inside: null, boxExhausted: true }
}

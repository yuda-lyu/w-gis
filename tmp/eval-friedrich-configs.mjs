// 系統評估: 多種 friedrich 配置 vs _kriging 的「誤差」與「效能」
// 目標: 找出是否存在「誤差可接受 且 比 _kriging 快」的 friedrich 配置
import interp2Kriging from '../src/interp2Kriging.mjs'
import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import { GaussianProcess, SquaredExp, Exponential, ConstantPrior } from '../src/friedrich/index.mjs'

function mkRand(seed) {
    let s = seed >>> 0
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
function now() { return Number(process.hrtime.bigint()) / 1e6 }

function genPs(n, rand) {
    let ps = []
    for (let i = 0; i < n; i++) ps.push({ x: rand() * 1000, y: rand() * 1000, z: rand() * 250 })
    return ps
}
function genTars(m, rand) {
    //查詢點避開原始點(隨機位置, 命中機率極低), 全部當內插評估
    let ts = []
    for (let i = 0; i < m; i++) ts.push({ x: 50 + rand() * 900, y: 50 + rand() * 900 })
    return ts
}

//建立 friedrich 內插器, 回傳 {trainMs, predFn}
function buildFriedrich(ps, mode) {
    let arr = ptsXYZtoArr(ps, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps
    let nv = itnm.nv, inv = itnm.inv
    let inputs = nps.map(v => [v.x, v.y])
    let outputs = nps.map(v => v.z)

    let t0 = now()
    let gp
    if (mode.type === 'default') {
        gp = GaussianProcess.default(inputs, outputs)
    }
    else {
        //固定 kernel, 不 ADAM
        let b = GaussianProcess.builder(inputs, outputs)
        if (mode.kernel === 'sqexp') b.setKernel(new SquaredExp(mode.ls, mode.ampl))
        else if (mode.kernel === 'exp') b.setKernel(new Exponential(mode.ls, mode.ampl))
        if (mode.noise !== undefined) b.setNoise(mode.noise)
        gp = b.train()
    }
    let trainMs = now() - t0

    let predFn = (tars) => {
        let pts = tars.map(t => [nv(t.x, 'x'), nv(t.y, 'y')])
        let nzs = gp.predict(pts)
        if (!Array.isArray(nzs)) nzs = [nzs]
        return nzs.map(nz => inv(nz, 'z'))
    }
    return { trainMs, predFn }
}

function buildKriging(ps) {
    let t0 = now()
    //預熱 train 已含在 interp2Kriging 內, 但 interp2Kriging 每次呼叫都重訓; 用單次多點呼叫
    let trainMs = now() - t0
    let predFn = (tars) => {
        let r = interp2Kriging(ps, tars)
        return r.map(o => o.z)
    }
    return { trainMs, predFn }
}

let configs = [
    { name: '_kriging(基準)', kind: 'krig' },
    { name: 'fried.default(ADAM)', kind: 'fried', mode: { type: 'default' } },
    { name: 'fried.sqexp ls=0.3', kind: 'fried', mode: { type: 'fixed', kernel: 'sqexp', ls: 0.3, ampl: 1, noise: 0.01 } },
    { name: 'fried.sqexp ls=0.5', kind: 'fried', mode: { type: 'fixed', kernel: 'sqexp', ls: 0.5, ampl: 1, noise: 0.01 } },
    { name: 'fried.exp ls=0.3', kind: 'fried', mode: { type: 'fixed', kernel: 'exp', ls: 0.3, ampl: 1, noise: 0.01 } },
    { name: 'fried.exp ls=0.5', kind: 'fried', mode: { type: 'fixed', kernel: 'exp', ls: 0.5, ampl: 1, noise: 0.01 } },
]

let sizes = [[20, 500], [50, 500], [100, 500], [200, 500]]

for (let [n, m] of sizes) {
    let rand = mkRand(777 + n * 13 + m)
    let ps = genPs(n, rand)
    let tars = genTars(m, rand)

    //基準: _kriging 預測值
    let krigZ = interp2Kriging(ps, tars).map(o => o.z)

    console.log(`\n========== N=${n} 原始點, M=${m} 查詢點 ==========`)
    console.log('配置'.padEnd(22), 'train+pred(ms)'.padStart(16), 'meanRelErr%'.padStart(14), 'maxRelErr%'.padStart(12))
    console.log('-'.repeat(68))

    for (let cfg of configs) {
        let reps = 3
        let bestMs = Infinity
        let zs = null
        for (let r = 0; r < reps; r++) {
            let t0 = now()
            if (cfg.kind === 'krig') {
                zs = interp2Kriging(ps, tars).map(o => o.z)
            }
            else {
                let f = buildFriedrich(ps, cfg.mode)
                zs = f.predFn(tars)
            }
            let ms = now() - t0
            if (ms < bestMs) bestMs = ms
        }

        //誤差 vs _kriging
        let sumRel = 0, maxRel = 0, cnt = 0
        for (let i = 0; i < zs.length; i++) {
            let zk = krigZ[i], zf = zs[i]
            if (!isFinite(zk) || !isFinite(zf)) continue
            let rel = Math.abs(zk - zf) / (Math.abs(zk) + 1e-9) * 100
            sumRel += rel; cnt++
            if (rel > maxRel) maxRel = rel
        }
        let meanRel = cnt > 0 ? sumRel / cnt : NaN
        let errStr = cfg.kind === 'krig' ? '—' : meanRel.toFixed(2)
        let maxStr = cfg.kind === 'krig' ? '—' : maxRel.toFixed(2)
        console.log(cfg.name.padEnd(22), bestMs.toFixed(2).padStart(16), errStr.padStart(14), maxStr.padStart(12))
    }
}
console.log('\n註: 誤差為 vs _kriging 之相對差; train+pred 含建模與全部M點預測')

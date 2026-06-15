// 共用評估工具: friedrich 固定 Exponential kernel vs _kriging 的誤差/效能
import interp2Kriging from '../src/interp2Kriging.mjs'
import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import { GaussianProcess, Exponential } from '../src/friedrich/index.mjs'

export function mkRand(seed) {
    let s = seed >>> 0
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
export function now() { return Number(process.hrtime.bigint()) / 1e6 }

// 資料分布產生器: dist ∈ 'uniform' | 'cluster' | 'grid'; zfun ∈ 'random' | 'smooth' | 'ridge'
export function genPs(n, rand, dist = 'uniform', zfun = 'random') {
    let pts = []
    if (dist === 'grid') {
        let side = Math.ceil(Math.sqrt(n))
        for (let i = 0; i < n; i++) {
            let gx = (i % side) / (side - 1 || 1)
            let gy = Math.floor(i / side) / (side - 1 || 1)
            pts.push([gx * 1000 + (rand() - 0.5) * 20, gy * 1000 + (rand() - 0.5) * 20])
        }
    }
    else if (dist === 'cluster') {
        let nc = Math.max(2, Math.floor(n / 10))
        let centers = []
        for (let c = 0; c < nc; c++) centers.push([rand() * 1000, rand() * 1000])
        for (let i = 0; i < n; i++) {
            let c = centers[Math.floor(rand() * nc)]
            pts.push([c[0] + (rand() - 0.5) * 150, c[1] + (rand() - 0.5) * 150])
        }
    }
    else {
        for (let i = 0; i < n; i++) pts.push([rand() * 1000, rand() * 1000])
    }
    return pts.map(([x, y]) => {
        let z
        if (zfun === 'smooth') z = 125 + 100 * Math.sin(x / 300) * Math.cos(y / 300)
        else if (zfun === 'ridge') z = 125 + 120 * Math.sin((x + y) / 250)
        else z = rand() * 250
        return { x, y, z }
    })
}

export function genTars(m, rand) {
    let ts = []
    for (let i = 0; i < m; i++) ts.push({ x: 50 + rand() * 900, y: 50 + rand() * 900 })
    return ts
}

// friedrich 固定 Exponential kernel 內插器 (正規化 + kpKnown 命中原始點回原值)
export function friedrichExpInterp(ps, ls = 0.5, noise = 0.01) {
    let arr = ptsXYZtoArr(ps, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps
    let nv = itnm.nv, inv = itnm.inv
    let inputs = nps.map(v => [v.x, v.y])
    let outputs = nps.map(v => v.z)
    let kp = {}
    nps.forEach(v => { kp[`${v.x}-${v.y}`] = v.z })

    let gp = GaussianProcess.builder(inputs, outputs).setKernel(new Exponential(ls, 1)).setNoise(noise).train()

    return (tars) => {
        return tars.map(t => {
            let nx = nv(t.x, 'x'), ny = nv(t.y, 'y')
            let k = `${nx}-${ny}`
            let nz = Object.prototype.hasOwnProperty.call(kp, k) ? kp[k] : gp.predict([nx, ny])
            return inv(nz, 'z')
        })
    }
}

// 對一組 (ps, tars) 算 friedrich(各ls) vs _kriging 的相對誤差
export function evalErrors(ps, tars, lsList = [0.3, 0.4, 0.5, 0.6, 0.7]) {
    let krigZ = interp2Kriging(ps, tars).map(o => o.z)
    let out = {}
    for (let ls of lsList) {
        let pred = friedrichExpInterp(ps, ls)
        let zs = pred(tars)
        let sum = 0, max = 0, cnt = 0
        for (let i = 0; i < zs.length; i++) {
            if (!isFinite(krigZ[i]) || !isFinite(zs[i])) continue
            let rel = Math.abs(krigZ[i] - zs[i]) / (Math.abs(krigZ[i]) + 1e-9) * 100
            sum += rel; cnt++; if (rel > max) max = rel
        }
        out[ls] = { mean: cnt ? sum / cnt : NaN, max }
    }
    return out
}

// 乾淨效能基準: friedrich Exp(ls=0.5) vs _kriging, 分離 train/predict, 多 N
import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import kriging from '../src/_kriging.mjs'
import { GaussianProcess, Exponential } from '../src/friedrich/index.mjs'
import { mkRand, genPs, genTars, now } from './krig-eval-lib.mjs'

function best(fn, reps) {
    let b = Infinity, last
    for (let i = 0; i < reps; i++) {
        let t0 = now()
        last = fn()
        let t = now() - t0
        if (t < b) b = t
    }
    return { ms: b, last }
}

function krigCore(ps, tars) {
    let arr = ptsXYZtoArr(ps, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps, nv = itnm.nv, inv = itnm.inv
    let xs = nps.map(v => v.x), ys = nps.map(v => v.y), ts = nps.map(v => v.z)
    let ntars = tars.map(t => [nv(t.x, 'x'), nv(t.y, 'y')])
    return {
        train: () => kriging.train(ts, xs, ys, 'exponential', 0, 100),
        predict: (vg) => ntars.map(p => inv(kriging.predict(p[0], p[1], vg), 'z')),
    }
}
function friCore(ps, tars) {
    let arr = ptsXYZtoArr(ps, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps, nv = itnm.nv, inv = itnm.inv
    let inputs = nps.map(v => [v.x, v.y]), outputs = nps.map(v => v.z)
    let ntars = tars.map(t => [nv(t.x, 'x'), nv(t.y, 'y')])
    return {
        train: () => GaussianProcess.builder(inputs, outputs).setKernel(new Exponential(0.5, 1)).setNoise(0.01).train(),
        predict: (gp) => { let r = gp.predict(ntars); return (Array.isArray(r) ? r : [r]).map(nz => inv(nz, 'z')) },
    }
}

let Ns = [20, 50, 100, 200, 300, 500, 800]
let M = 1000

console.log(`效能基準 (ms, 多reps取最佳). M=${M}查詢點. friedrich=Exp(ls=0.5,noise=0.01)固定kernel`)
console.log('='.repeat(96))
console.log(
    'N'.padStart(5),
    '| krig.train'.padStart(13), 'krig.pred'.padStart(11), 'krig.total'.padStart(12),
    '| fri.train'.padStart(12), 'fri.pred'.padStart(11), 'fri.total'.padStart(11),
    '| speedup'.padStart(10),
)
console.log('-'.repeat(96))

for (let n of Ns) {
    let rand = mkRand(424242 + n)
    let ps = genPs(n, rand, 'uniform', 'smooth')
    let tars = genTars(M, rand)
    let reps = n >= 500 ? 3 : 5

    let kc = krigCore(ps, tars)
    let fc = friCore(ps, tars)

    let kt = best(() => kc.train(), reps)
    let kp = best(() => kc.predict(kt.last), reps)
    let ft = best(() => fc.train(), reps)
    let fp = best(() => fc.predict(ft.last), reps)

    let kTotal = kt.ms + kp.ms
    let fTotal = ft.ms + fp.ms
    let speedup = kTotal / fTotal

    console.log(
        String(n).padStart(5),
        '|', kt.ms.toFixed(2).padStart(10), kp.ms.toFixed(2).padStart(11), kTotal.toFixed(2).padStart(12),
        '|', ft.ms.toFixed(2).padStart(9), fp.ms.toFixed(2).padStart(11), fTotal.toFixed(2).padStart(11),
        '|', (speedup.toFixed(2) + 'x').padStart(10),
    )
}
console.log('='.repeat(96))
console.log('speedup>1 = friedrich 較快(總時間). train=建模一次, pred=全部M點')

// 最終公平對比: friedrich(fast O(n) predict) vs _kriging 各 model (退化 exp / 正常 gaussian,spherical)
import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import kriging from '../src/_kriging.mjs'
import { GaussianProcess, ZeroPrior, Exponential } from '../src/friedrich/index.mjs'
import { mkRand, genPs, genTars, now } from './krig-eval-lib.mjs'

function best(fn, reps) {
    let b = Infinity, last
    for (let i = 0; i < reps; i++) { let t0 = now(); last = fn(); let t = now() - t0; if (t < b) b = t }
    return { ms: b, last }
}

function friFast(inputs, outputs, ntars, inv) {
    let gp = GaussianProcess.builder(inputs, outputs).setPrior(new ZeroPrior())
        .setKernel(new Exponential(0.5, 1)).setNoise(0.01).setCholeskyEpsilon(1e-12).train()
    let trainM = gp.trainingInputs.asMatrix()
    let alpha = gp.covmatCholesky.solve(gp.trainingOutputs.asVector())
    let kernel = gp.kernel, n = trainM.length
    return ntars.map(q => { let a = 0; for (let t = 0; t < n; t++) a += kernel.kernel(trainM[t], q) * alpha[t]; return inv(a, 'z') })
}

let Ns = [50, 100, 200, 300, 500, 800]
let M = 1000

console.log(`最終效能對比 (total ms, train+predict). M=${M}查詢點`)
console.log('='.repeat(92))
console.log('N'.padStart(5),
    '| friedrich(fast)'.padStart(16), '| krig.exp(退化)'.padStart(16), 'krig.gauss(正常)'.padStart(17), 'krig.sph(正常)'.padStart(15))
console.log('-'.repeat(92))

for (let n of Ns) {
    let rand = mkRand(31337 + n)
    let ps = genPs(n, rand, 'uniform', 'smooth')
    let tars = genTars(M, rand)
    let reps = n >= 300 ? 3 : 5

    let arr = ptsXYZtoArr(ps, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps, nv = itnm.nv, inv = itnm.inv
    let xs = nps.map(v => v.x), ys = nps.map(v => v.y), ts = nps.map(v => v.z)
    let inputs = nps.map(v => [v.x, v.y]), outputs = ts.slice()
    let ntars = tars.map(t => [nv(t.x, 'x'), nv(t.y, 'y')])

    let fri = best(() => friFast(inputs, outputs, ntars, inv), reps).ms

    let krigModel = (model) => {
        let t = best(() => kriging.train(ts, xs, ys, model, 0, 100), reps)
        let p = best(() => ntars.map(q => inv(kriging.predict(q[0], q[1], t.last), 'z')), reps)
        return t.ms + p.ms
    }
    let ke = krigModel('exponential')
    let kg = krigModel('gaussian')
    let ksph = krigModel('spherical')

    console.log(String(n).padStart(5),
        '|', fri.toFixed(2).padStart(14),
        '|', ke.toFixed(2).padStart(14), kg.toFixed(2).padStart(17), ksph.toFixed(2).padStart(15))
}
console.log('='.repeat(92))
console.log('friedrich(fast)=Exponential(0.5)+ZeroPrior+預算alpha+O(n)predict')
console.log('krig.exp 走退化gauss-jordan(慢); krig.gauss/sph 走正常Cholesky(快)')

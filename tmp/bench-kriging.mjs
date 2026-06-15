// 效能與數值對比: _kriging.mjs (Ordinary Kriging) vs friedrich (Gaussian Process Regression)
import kriging from '../src/_kriging.mjs'
import { GaussianProcess } from '../src/friedrich/index.mjs'

function mkRand(seed) {
    let s = seed >>> 0
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
    }
}

//產生原始點: x,y ∈ [0,1000], z ∈ [0,250]
function genData(n, rand) {
    let xs = [], ys = [], ts = [], inputs = [], outputs = []
    for (let i = 0; i < n; i++) {
        let x = rand() * 1000
        let y = rand() * 1000
        let z = rand() * 250
        xs.push(x); ys.push(y); ts.push(z)
        inputs.push([x, y]); outputs.push(z)
    }
    return { xs, ys, ts, inputs, outputs }
}

function genTargets(m, rand) {
    let pts = []
    for (let i = 0; i < m; i++) {
        pts.push([50 + rand() * 900, 50 + rand() * 900])
    }
    return pts
}

function now() {
    return Number(process.hrtime.bigint()) / 1e6
}

//規模 [N原始點, M查詢點]
let cases = [
    [10, 200],
    [25, 500],
    [50, 1000],
    [100, 1000],
    [200, 1000],
]

console.log('引擎效能對比 (ms, 取最佳值). train=建模, predict=全部M點預測')
console.log('='.repeat(108))
console.log(
    'N'.padStart(5), 'M'.padStart(6),
    '| _krig.train'.padStart(14), '_krig.pred'.padStart(12),
    '| fried.def(train+ADAM)'.padStart(23), 'fried.pred'.padStart(12),
    '| fried.noopt.train'.padStart(20),
)
console.log('-'.repeat(108))

for (let [n, m] of cases) {
    let rand = mkRand(20260615 + n * 7 + m)
    let data = genData(n, rand)
    let targets = genTargets(m, rand, data.norm)

    let reps = 3

    // --- A. _kriging ---
    let tKrigTrain = Infinity, tKrigPred = Infinity
    let krigPreds = null
    for (let r = 0; r < reps; r++) {
        let t0 = now()
        let vg = kriging.train(data.ts, data.xs, data.ys, 'exponential', 0, 100)
        let t1 = now()
        let preds = []
        for (let p of targets) {
            preds.push(kriging.predict(p[0], p[1], vg))
        }
        let t2 = now()
        if (t1 - t0 < tKrigTrain) tKrigTrain = t1 - t0
        if (t2 - t1 < tKrigPred) tKrigPred = t2 - t1
        krigPreds = preds
    }

    // --- B. friedrich default (含 ADAM 優化) ---
    let tFriTrain = Infinity, tFriPred = Infinity
    let friPreds = null
    for (let r = 0; r < reps; r++) {
        let t0 = now()
        let gp = GaussianProcess.default(data.inputs, data.outputs)
        let t1 = now()
        let preds = gp.predict(targets)
        let t2 = now()
        if (t1 - t0 < tFriTrain) tFriTrain = t1 - t0
        if (t2 - t1 < tFriPred) tFriPred = t2 - t1
        friPreds = preds
    }

    // --- C. friedrich no-opt (固定預設 kernel, 不 ADAM) ---
    let tFriNoOpt = Infinity
    let friNoOptPreds = null
    for (let r = 0; r < reps; r++) {
        let t0 = now()
        let gp = GaussianProcess.builder(data.inputs, data.outputs).train()
        let t1 = now()
        let preds = gp.predict(targets)
        if (t1 - t0 < tFriNoOpt) tFriNoOpt = t1 - t0
        friNoOptPreds = preds
    }

    console.log(
        String(n).padStart(5), String(m).padStart(6),
        '|', tKrigTrain.toFixed(2).padStart(11), tKrigPred.toFixed(2).padStart(12),
        '|', tFriTrain.toFixed(2).padStart(20), tFriPred.toFixed(2).padStart(12),
        '|', tFriNoOpt.toFixed(2).padStart(17),
    )

    //數值合理性: 前3個查詢點各引擎預測值 + 資料z範圍
    if (n === 50) {
        let zmin = Math.min(...data.ts), zmax = Math.max(...data.ts)
        console.log(`     [數值樣本 N=${n}] 資料z範圍=[${zmin.toFixed(1)}, ${zmax.toFixed(1)}]`)
        for (let i = 0; i < 3; i++) {
            console.log(`       點${i} [${targets[i][0].toFixed(0)},${targets[i][1].toFixed(0)}]: _krig=${krigPreds[i].toFixed(2)}  fried.def=${friPreds[i].toFixed(2)}  fried.noopt=${friNoOptPreds[i].toFixed(2)}`)
        }
    }
}

console.log('='.repeat(108))
console.log('註: _kriging 與 friedrich 為不同演算法(Ordinary Kriging vs GP Regression), 預測值不應相同, 但都應落在合理內插範圍')

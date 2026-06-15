// 可行性驗證: friedrich GP 內插值 vs _kriging (interp2Kriging) 誤差
import interp2Kriging from '../src/interp2Kriging.mjs'
import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import { GaussianProcess } from '../src/friedrich/index.mjs'

let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

//查詢點 (含內插與外插)
let targets = [
    { x: 243, y: 205 },   // case1 _krig=94.88479948418721
    { x: 283, y: 205 },   // case2 _krig=116.32333499687805
    { x: 1160, y: 380 },  // case3(外插) _krig=87.27045807621836
    { x: 500, y: 200 },
    { x: 700, y: 300 },
    { x: 243, y: 206 },   // 命中原始點, 應≈95
]

//--- friedrich 版內插 (正規化 + GaussianProcess.default) ---
function friedrichKriging(psSrc, tars) {
    let arr = ptsXYZtoArr(psSrc, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps
    let nv = itnm.nv
    let inv = itnm.inv

    let inputs = nps.map(v => [v.x, v.y])
    let outputs = nps.map(v => v.z)

    let gp = GaussianProcess.default(inputs, outputs)

    return tars.map(t => {
        let nx = nv(t.x, 'x')
        let ny = nv(t.y, 'y')
        let nz = gp.predict([nx, ny])
        let z = inv(nz, 'z')
        return z
    })
}

let friResults = friedrichKriging(ps, targets)

console.log('查詢點'.padEnd(20), '_kriging'.padStart(12), 'friedrich'.padStart(12), 'absErr'.padStart(10), 'relErr%'.padStart(10))
console.log('-'.repeat(70))
let maxRel = 0
for (let i = 0; i < targets.length; i++) {
    let t = targets[i]
    let rk = interp2Kriging(ps, t)
    let zk = rk.z
    let zf = friResults[i]
    let abs = Math.abs(zk - zf)
    let rel = abs / (Math.abs(zk) + 1e-9) * 100
    if (rel > maxRel) maxRel = rel
    console.log(
        `[${t.x},${t.y}]`.padEnd(20),
        zk.toFixed(4).padStart(12),
        zf.toFixed(4).padStart(12),
        abs.toFixed(4).padStart(10),
        rel.toFixed(2).padStart(10),
    )
}
console.log('-'.repeat(70))
console.log(`資料z範圍: [22, 249], 全距 227`)
console.log(`最大相對誤差: ${maxRel.toFixed(2)}%`)

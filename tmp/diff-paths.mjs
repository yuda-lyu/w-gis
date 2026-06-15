// 對照 interp2KrigingGP 與 probe 的 friSqExp 兩條路徑, 找出 gaussian {243,205} 數值差異來源
import interp2KrigingGP from '../src/interp2KrigingGP.mjs'
import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import { GaussianProcess, SquaredExp } from '../src/friedrich/index.mjs'

let ps10 = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
let tar = { x: 243, y: 205 }

// 路徑1: interp2KrigingGP (model=gaussian, 預設 ls=1.0, noise=0.01)
let r1 = interp2KrigingGP(ps10, tar, { model: 'gaussian' })
console.log('interp2KrigingGP gaussian(預設ls=1.0):', r1.z)

let r1b = interp2KrigingGP(ps10, tar, { model: 'gaussian', ls: 1.0, noise: 0.01 })
console.log('interp2KrigingGP gaussian(顯式ls=1.0,noise=0.01):', r1b.z)

// 路徑2: probe friSqExp 邏輯重現
function friSqExp(ps, ls, noise) {
    let arr = ptsXYZtoArr(ps, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps, nv = itnm.nv, inv = itnm.inv
    let inputs = nps.map(v => [v.x, v.y]), outputs = nps.map(v => v.z)
    let kp = {}; nps.forEach(v => { kp[`${v.x}-${v.y}`] = v.z })
    let gp = GaussianProcess.builder(inputs, outputs).setKernel(new SquaredExp(ls, 1)).setNoise(noise).train()
    return (tars) => tars.map(t => {
        let nx = nv(t.x, 'x'), ny = nv(t.y, 'y')
        let k = `${nx}-${ny}`
        let nz = Object.prototype.hasOwnProperty.call(kp, k) ? kp[k] : gp.predict([nx, ny])
        return inv(nz, 'z')
    })
}
let r2 = friSqExp(ps10, 1.0, 0.01)([tar])[0]
console.log('probe friSqExp(ls=1.0,noise=0.01):', r2)

// 檢查正規化後的 nx,ny,以及 inputs/outputs 是否一致
let arr = ptsXYZtoArr(ps10, {})
let itnm = interp2Normalize(arr, { scale: 1 })
console.log('\n正規化後查詢點:', itnm.nv(243, 'x'), itnm.nv(205, 'y'))
console.log('正規化後 inputs[0..2]:', itnm.ps.slice(0, 3).map(v => [v.x, v.y, v.z]))
console.log('st (正規化參數):', JSON.stringify(itnm.st))

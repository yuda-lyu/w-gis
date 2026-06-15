import interp2Normalize from '../src/interp2Normalize.mjs'
import ptsXYZtoArr from '../src/ptsXYZtoArr.mjs'
import ptsXYtoArr from '../src/ptsXYtoArr.mjs'
import { GaussianProcess, SquaredExp } from '../src/friedrich/index.mjs'

let ps10 = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
let tar = { x: 243, y: 205 }

// 路徑1 (interp2KrigingGP 風格): ptsXYtoArr 處理 psTar
function path1() {
    let psSrc = ptsXYZtoArr(ps10, { model: 'gaussian' })
    let psTar = ptsXYtoArr([tar], { model: 'gaussian' })
    let itnm = interp2Normalize(psSrc, { scale: 1 })
    let nps = itnm.ps, nv = itnm.nv, inv = itnm.inv
    let inputs = [], outputs = []
    nps.forEach(v => { inputs.push([v.x, v.y]); outputs.push(v.z) })
    let gp = GaussianProcess.builder(inputs, outputs).setKernel(new SquaredExp(1.0, 1)).setNoise(0.01).train()
    let p = psTar[0]
    let nx = nv(p.x, 'x'), ny = nv(p.y, 'y')
    return { inputs, outputs, nx, ny, z: inv(gp.predict([nx, ny]), 'z') }
}

// 路徑2 (friSqExp 風格): 直接用 tar
function path2() {
    let arr = ptsXYZtoArr(ps10, {})
    let itnm = interp2Normalize(arr, { scale: 1 })
    let nps = itnm.ps, nv = itnm.nv, inv = itnm.inv
    let inputs = nps.map(v => [v.x, v.y]), outputs = nps.map(v => v.z)
    let nx = nv(tar.x, 'x'), ny = nv(tar.y, 'y')
    let gp = GaussianProcess.builder(inputs, outputs).setKernel(new SquaredExp(1.0, 1)).setNoise(0.01).train()
    return { inputs, outputs, nx, ny, z: inv(gp.predict([nx, ny]), 'z') }
}

let a = path1()
let b = path2()
console.log('path1 z:', a.z)
console.log('path2 z:', b.z)
console.log('inputs 相同?', JSON.stringify(a.inputs) === JSON.stringify(b.inputs))
console.log('outputs 相同?', JSON.stringify(a.outputs) === JSON.stringify(b.outputs))
console.log('查詢點 nx 相同?', a.nx === b.nx, ' (', a.nx, 'vs', b.nx, ')')
console.log('查詢點 ny 相同?', a.ny === b.ny, ' (', a.ny, 'vs', b.ny, ')')
console.log('path1 inputs[0..2]:', JSON.stringify(a.inputs.slice(0, 2)))
console.log('path2 inputs[0..2]:', JSON.stringify(b.inputs.slice(0, 2)))
console.log('path1 outputs[0..2]:', JSON.stringify(a.outputs.slice(0, 3)))
console.log('path2 outputs[0..2]:', JSON.stringify(b.outputs.slice(0, 3)))

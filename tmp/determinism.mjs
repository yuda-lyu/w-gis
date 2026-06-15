// 測 friedrich GP 是否確定性: 同樣輸入連續建模預測多次, 看結果是否一致
import { GaussianProcess, SquaredExp, Exponential } from '../src/friedrich/index.mjs'

// 寫死的正規化 inputs/outputs (10點)
let inputs = [[0.19646017699115045, 0.5168141592920354], [0.18761061946902655, 0.5336283185840708], [0, 0.6221238938053097], [0.8247787610619469, 0.35929203539823007], [0.947787610619469, 0.5911504424778761], [0.6398230088495576, 0.511504424778761], [0.13539823008849558, 0.33716814159292036], [0.45663716814159294, 0.6601769911504425], [1, 0.6628318584070797], [0.7017699115044248, 0.5575221238938053]]
let outputs = [0.32158590308370044, 0.5462555066079295, 0, 0.8854625550660793, 0.07488986784140969, 0.7444933920704846, 0, 1, 0.28193832599118945, 0.45374449339207046]
let q = [0.19646017699115045, 0.515929203539823]

function run(kernelFn) {
    let gp = GaussianProcess.builder(inputs, outputs).setKernel(kernelFn()).setNoise(0.01).train()
    return gp.predict(q)
}

console.log('=== SquaredExp(1.0,1), 連續5次 (新建 kernel 實例) ===')
for (let i = 0; i < 5; i++) console.log(`  run${i}:`, run(() => new SquaredExp(1.0, 1)))

console.log('=== SquaredExp(1.0,1), 重用同一 kernel 實例 ===')
let sharedK = new SquaredExp(1.0, 1)
for (let i = 0; i < 5; i++) {
    let gp = GaussianProcess.builder(inputs, outputs).setKernel(sharedK).setNoise(0.01).train()
    console.log(`  run${i}:`, gp.predict(q))
}

console.log('=== Exponential(0.5,1), 連續3次 ===')
for (let i = 0; i < 3; i++) console.log(`  run${i}:`, run(() => new Exponential(0.5, 1)))

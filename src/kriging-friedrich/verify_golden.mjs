// 獨立驗證：JS 移植版 vs Rust friedrich 的 golden 數值。
// 6 個顯式（不擬合）配置要求 1e-9 一致；2 個 default（含 ADAM 擬合）僅資訊性對照。
import { readFileSync } from 'node:fs';
import {
    GaussianProcess, SquaredExp, Exponential, Matern1, Matern2, RationalQuadratic,
    Linear, Polynomial, HyperTan, Multiquadric,
} from './index.mjs';

const golden = JSON.parse(readFileSync('./golden_rust.json', 'utf8'));

const inputs = [[0.0], [1.0], [2.0], [3.0], [4.0]];
const outputs = [0.0, 1.0, 0.0, -1.0, 0.0];
const test = [[0.5], [1.5], [2.5], [5.0], [10.0]];

const buildExplicit = (kernel) =>
    GaussianProcess.builder(inputs, outputs).setKernel(kernel).setNoise(0.1).setCholeskyEpsilon(1e-6).train();

// 計算 JS 端各配置
const js = {};
{
    const gp = buildExplicit(new SquaredExp(1.0, 1.0));
    js.sqexp = { means: gp.predict(test), vars: gp.predict_variance(test), cov: gp.predict_covariance(test) };
}
js.exp = (() => { const g = buildExplicit(new Exponential(1.0, 1.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.matern1 = (() => { const g = buildExplicit(new Matern1(1.0, 1.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.matern2 = (() => { const g = buildExplicit(new Matern2(1.0, 1.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.ratquad = (() => { const g = buildExplicit(new RationalQuadratic(1.0, 1.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.linear = (() => { const g = buildExplicit(new Linear(1.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.polynomial = (() => { const g = buildExplicit(new Polynomial(1.0, 1.0, 2.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.hypertan = (() => { const g = buildExplicit(new HyperTan(1.0, 0.5)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
js.multiquadric = (() => { const g = buildExplicit(new Multiquadric(1.0)); return { means: g.predict(test), vars: g.predict_variance(test) }; })();
{
    const inputs2 = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const outputs2 = [0, 1, 1, 2];
    const test2 = [[0.5, 0.5], [0.2, 0.8]];
    const g = GaussianProcess.builder(inputs2, outputs2).setKernel(new SquaredExp(1.0, 1.0)).setNoise(0.1).setCholeskyEpsilon(1e-6).train();
    js.sqexp_2d = { means: g.predict(test2), vars: g.predict_variance(test2) };
}
// fitted（資訊性）
{
    const g = GaussianProcess.default(inputs, outputs);
    const mv = g.predict_mean_variance(test);
    // predict_mean_variance 回傳格式：可能是 {means,variances} 或 [means,vars]
    const means = Array.isArray(mv) ? mv[0] : (mv.means ?? mv[0]);
    const vars = Array.isArray(mv) ? mv[1] : (mv.variances ?? mv.vars ?? mv[1]);
    js.default = { means, vars };
}
{
    const g = GaussianProcess.default(inputs, outputs);
    g.add_samples([[5.0]], [10.0]);
    js.default_added = { means: g.predict(test), vars: g.predict_variance(test) };
}

// 比較工具
const flat = (a) => Array.isArray(a[0]) ? a.flat() : a;
// 相對誤差（值可能達 1e104，絕對誤差無意義；用 |a-b|/max(1,|a|,|b|)）
const maxRelDiff = (a, b) => {
    const fa = flat(a), fb = flat(b);
    let m = 0;
    for (let i = 0; i < fa.length; i++) {
        const scale = Math.max(1, Math.abs(fa[i]), Math.abs(fb[i]));
        m = Math.max(m, Math.abs(fa[i] - fb[i]) / scale);
    }
    return m;
};
const maxAbsDiff = maxRelDiff;

const strict = ['sqexp', 'exp', 'matern1', 'matern2', 'ratquad', 'linear', 'polynomial', 'hypertan', 'multiquadric', 'sqexp_2d'];
const soft = ['default', 'default_added'];
const TOL = 1e-9;

let allPass = true;
console.log('=== 嚴格對拍（不擬合，相對誤差要求 < 1e-9）===');
for (const key of strict) {
    const g = golden[key], j = js[key];
    const fields = Object.keys(g);
    let worst = 0;
    for (const f of fields) worst = Math.max(worst, maxAbsDiff(g[f], j[f]));
    const ok = worst < TOL;
    allPass = allPass && ok;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${key.padEnd(10)} maxAbsDiff=${worst.toExponential(3)}  (${fields.join(',')})`);
}

console.log('=== 資訊性對照（含 ADAM 擬合，預期接近但非位元一致）===');
for (const key of soft) {
    const g = golden[key], j = js[key];
    let worst = 0;
    for (const f of ['means', 'vars']) worst = Math.max(worst, maxAbsDiff(g[f], j[f]));
    console.log(`  INFO  ${key.padEnd(13)} maxAbsDiff=${worst.toExponential(3)}`);
}

console.log(allPass ? '\n✅ 全部嚴格配置 1e-9 通過' : '\n❌ 有嚴格配置未通過');
process.exit(allPass ? 0 : 1);

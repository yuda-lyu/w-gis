# friedrich 0.6.0 → JavaScript (ESM) 移植規格書 (PORT_SPEC.md)

本文件是把 Rust crate **friedrich 0.6.0**（Gaussian Process Regression）忠實移植為**零外部依賴的 ES6 module（.mjs）**的權威規格。所有 agent 必須遵守本文件的 API 簽名、資料表示與數學公式，確保各自獨立移植後仍彼此 API 相容。

來源：`D:/tmp/friedrich/src/`（勿改動），輸出：`D:/tmp/friedrich-js/`。

---

## 0. 通用移植守則（所有 agent 必守）

1. **忠實移植**：語意與數值需與 Rust 0.6.0 一致。包含 Rust 源碼中的**既有 bug 也要忠實照搬**（見 §4 Multiquadric 兩處註記），不可「順手修正」——一致性優先。注意到 bug 在 JSDoc 標 `// NOTE: faithful to Rust source (latent bug)` 即可，不改行為。
2. **零外部 npm 依賴**：
   - nalgebra 的線代（矩陣乘、向量、Cholesky、三角求解、矩陣求逆、trace、SVD/最小平方）→ 全部用純 JS 自行實作於 `algebra.mjs`。
   - rand / rand_distr → 自帶可種子化 PRNG（mulberry32）+ Box-Muller 常態取樣於 `multivariate_normal.mjs`。
   - chrono 的逾時 → 用 `Date.now()`（毫秒）或純迭代上限。
3. **資料表示（全專案統一，務必遵守）**：
   - 點 / 向量 = `number[]`
   - 資料集 / 矩陣 = `number[][]`（**每列一 row**；`matrix[r][c]` = 第 r 列第 c 行）
   - **一個樣本 = 矩陣的一列**（row-per-sample）。Rust 的 `DMatrix` 是 column-major，但我們的 JS 表示是 row-major 的巢狀陣列，語意對齊「每列一筆樣本」即可，不需模擬 column-major 記憶體佈局。
4. **ESM**：每個 `.mjs` 用 `export` / `import`；同資料夾互相引用一律 `'./x.mjs'`。
5. **JSDoc**：保留原始碼 doc 註解意圖，用 JSDoc 簡述每個 class / function 的數學公式。
6. **語法檢查**：寫完每個檔案後務必 `node --check <檔案>` 確認語法無誤。
7. **暫存檔**：若需暫存/探索 dump，一律落在 `D:/tmp/friedrich-js/tmp/`；任務結束前清乾淨。**禁用** `/tmp`、`$TMPDIR`、`$HOME`、cwd 根目錄雜檔。
8. **正確性 > 效能**：以可讀、idiomatic JS 為先。
9. **不改 Rust 源碼**（`D:/tmp/friedrich`）。

---

## 1. JS 模組佈局

| .mjs 檔 | 對應 Rust 檔 | 職責 |
|---|---|---|
| `algebra.mjs` | `algebra/mod.rs` + `algebra/extendable_matrix.rs` + nalgebra 線代 | 純 JS 線代原語（matMul/matVec/dot/norm…）、Cholesky 與三角求解、矩陣求逆、trace、最小平方（給 LinearPrior）、`ExtendableMatrix`/`ExtendableVector` class、`CholeskyDecomposition` class（支援 `insertColumn` O(n²) 增量更新）、`makeCovarianceMatrix`/`makeCholeskyCovMatrix`/`addRowsCholeskyCovMatrix`/`makeGradientCovarianceMatrices` |
| `kernels.mjs` | `parameters/kernel.rs` | 全部 kernel class（SquaredExp/Gaussian、Exponential、Matern1、Matern2、Linear、Polynomial、HyperTan、Multiquadric、RationalQuadratic）+ KernelSum / KernelProd / `add`/`mul` 組合 + heuristic 輔助（fitBandwidthMean / fitAmplitudeVar） |
| `priors.mjs` | `parameters/prior.rs` | ZeroPrior / ConstantPrior / LinearPrior |
| `conversion.mjs` | `conversion/mod.rs` | 輸入彈性處理：number[] 單點 vs number[][] 多點；輸出 number vs number[]。提供 `toMatrix`/`toVector`/`fromVector`/`isSingle` |
| `optimizer.mjs` | `gaussian_process/optimizer.rs` | ADAM 梯度上升 log-likelihood：`optimizeParameters`（非 scalable）、`scaledOptimizeParameters`（scalable）、`gradientMarginalLikelihood`、`scaledGradientMarginalLikelihood`。以 mixin / 自由函式形式掛到 GP 上 |
| `multivariate_normal.mjs` | `gaussian_process/multivariate_normal.rs` | `MultivariateNormal` class + PRNG（mulberry32）+ Box-Muller standard normal |
| `gaussian_process.mjs` | `gaussian_process/mod.rs` + `gaussian_process/builder.rs` | `GaussianProcess` class（train/predict/predictVariance/predictCovariance/predictMeanVariance/addSamples/sampleAt/likelihood/fitParameters）+ `GaussianProcessBuilder` + 靜態 `GaussianProcess.default(...)` / `GaussianProcess.builder(...)` |
| `index.mjs` | `lib.rs` | re-export 公開 API（GaussianProcess、GaussianProcessBuilder、所有 kernel、所有 prior、MultivariateNormal） |

**依賴方向**（import 圖，無環）：
```
index.mjs → gaussian_process.mjs → { optimizer.mjs, multivariate_normal.mjs, kernels.mjs, priors.mjs, conversion.mjs, algebra.mjs }
optimizer.mjs → algebra.mjs
multivariate_normal.mjs → conversion.mjs
kernels.mjs → algebra.mjs (僅用向量原語)
priors.mjs → algebra.mjs (LinearPrior fit 用最小平方)
conversion.mjs → (無內部依賴)
algebra.mjs → (無內部依賴)
```

---

## 2. 統一資料表示與 `algebra.mjs` 的訂死簽名

### 2.1 型別約定
- `matrix = number[][]`：`matrix.length` = 列數（樣本數 / row 數）；`matrix[0].length` = 行數（維度）。空矩陣以 `[]` 表示但禁止傳入（對齊 Rust `assert_ne!(nb_rows, 0)`）。
- `vector = number[]`。
- 「row vector」與「column vector」在 JS 都用 `number[]`，由上下文決定。

### 2.2 `algebra.mjs` 必須 export 的函式（簽名訂死，後續 agent 直接 import）

**基本向量運算（輸入 `number[]`）**
```js
export function dot(a, b)            // Σ aᵢbᵢ  → number
export function subVec(a, b)         // a - b   → number[]
export function addVec(a, b)         // a + b   → number[]
export function scaleVec(a, s)       // s·a     → number[]
export function norm(a)              // sqrt(Σ aᵢ²) (歐式範數) → number
export function normSquared(a)       // Σ aᵢ²   → number
export function hypot(a, b)          // sqrt(a²+b²) 數值穩定版（對齊 f64::hypot）→ number
```

**矩陣 / 矩陣-向量運算（matrix = number[][]，每列一 row）**
```js
export function matMul(A, B)         // A(m×k) · B(k×n) → number[][] (m×n)
export function matVec(A, x)         // A(m×n) · x(n)   → number[] (m)
export function matTransposeVec(A, x)// Aᵀ(n×m) · x(m)  → number[] (n)   等價 transpose(A)·x
export function transpose(A)         // → number[][]
export function matSub(A, B)         // A - B → number[][]
export function identity(n)          // n×n 單位矩陣 → number[][]
export function zeros(m, n)          // m×n 全 0 → number[][]
export function diagonal(A)          // 取對角線 → number[]
export function trace(A)             // Σ Aᵢᵢ → number
```

**Cholesky 與三角求解**
```js
// 對稱正定矩陣 A(n×n) 的 Cholesky 分解 A = L·Lᵀ，回傳下三角 L (number[][])。
// 失敗（非正定）時：若 epsilon 為 null → throw Error（對齊 Rust .expect panic）；
// 若 epsilon 為有限正數 → 對齊 nalgebra new_with_substitute：當某對角項 dⱼ ≤ 0 時，
// 以 epsilon 取代該對角項（substitute）後繼續分解（見 §2.4 演算法細節）。
export function cholesky(A, epsilon = null)        // → number[][] (下三角 L)

// 解 L·x = b，L 為下三角。b 可為 number[]（解一個向量）或 number[][]（逐欄解，每欄一個 RHS）。
// 回傳同形狀（number[] 或 number[][]）。對齊 nalgebra solve_lower_triangular。
export function solveLowerTri(L, b)                // → number[] | number[][]

// 解 Uᵀ... 不需要；我們需要解 Lᵀ·x = b（上三角，U = Lᵀ）。
export function solveUpperTri(U, b)                // 解 U·x = b，U 上三角 → number[] | number[][]

// 用已分解的 L（A = L·Lᵀ）解 A·X = B：先 solveLowerTri 再 solveUpperTri。
// B 可為 number[] 或 number[][]。對齊 nalgebra Cholesky::solve / solve_mut。
export function choleskySolve(L, B)                // → number[] | number[][]

// 由 L 計算 A⁻¹ = (L·Lᵀ)⁻¹（對齊 nalgebra Cholesky::inverse），回傳 number[][]。
export function choleskyInverse(L)                 // → number[][]
```

**雜項**
```js
// 回傳 A 的「副本並對對角線加上 value」：Aᵢᵢ += value。不就地修改入參。
export function addToDiagonal(A, value)            // → number[][]

// 最小平方解 min ‖A·x − b‖（供 LinearPrior.fit），A 可為非方陣。
// 對齊 Rust 用 SVD solve（threshold 0）。可用 normal equations (AᵀA)x = Aᵀb + Cholesky/高斯消去，
// 或自行實作 SVD。允許數值近似，但需通過 LinearPrior 整合測試。
export function lstsqSolve(A, b)                    // → number[] (長度 = A 的行數)
```

### 2.3 `ExtendableMatrix` / `ExtendableVector`（對應 `EMatrix`/`EVector`）

語意：可增列。JS 實作可直接用陣列 `push`，**不需**模擬 Rust 的容量倍增（1.5×）策略——那是記憶體最佳化，對數值無影響。

```js
export class ExtendableMatrix {
  constructor(data /* number[][] */)
  get nrows()                       // 列數
  get ncols()                       // 行數
  asMatrix()                        // 回傳目前資料 number[][]（可回傳內部引用或副本；呼叫端只讀）
  addRows(rows /* number[][] */)    // 在底部追加列（就地）
}

export class ExtendableVector {
  constructor(data /* number[] */)
  get nrows()
  asVector()                        // → number[]
  addRows(rows /* number[] */)      // 追加（就地）
  assign(rows /* number[] */)       // 覆寫全部內容；長度須與現長相同（對齊 assert_eq）
}
```

### 2.4 `CholeskyDecomposition` class（增量更新的關鍵）

Rust 把 Cholesky 分解物件存在 GP 內並透過 `insert_column` 做 O(n²) 增量更新（`add_samples`）。JS 需提供等價物件。

```js
export class CholeskyDecomposition {
  // 由對稱正定矩陣建立。epsilon: null → 失敗 throw；正數 → substitute 模式。
  constructor(A /* number[][] */, epsilon = null)

  l()                               // → number[][] 下三角 L
  solve(B)                          // 解 A·X = B，B: number[]|number[][] → 同形狀（= choleskySolve(this.l(), B)）
  solveLower(B)                     // 解 L·X = B（= solveLowerTri(this.l(), B)）
  inverse()                         // → number[][] A⁻¹
  trace()                           // → number  trace(A⁻¹)（注意：是 inverse 的 trace，見下方使用點）

  // 在位置 col_index 插入一列/欄，得到 (n+1)×(n+1) 的新分解。
  // newColumn 長度 = col_index+1，是新 row 與所有「已有 row + 自己」的協方差（最後一項已含 noise²）。
  // 採用 rank-1 風格的 O(n²) 更新（見演算法說明）；可回傳新物件或就地更新後回傳 this。
  insertColumn(colIndex, newColumn /* number[] */)
}
```

**`insertColumn` 演算法**（對齊 nalgebra `Cholesky::insert_column`，在尾端 `col_index = 舊維度` 插入時退化為標準「邊界化」更新）：
設舊分解 `A = L·Lᵀ`（L 為 n×n 下三角），要把 A 擴成 (n+1)×(n+1)，新增的最後一列/欄為向量 `v`（長度 n+1，`v[0..n]` = 與舊點的協方差，`v[n]` = 自身協方差 + noise²）。新 L' 為：
```
L' = [ L      0   ]
     [ l21ᵀ   l22 ]
其中  L · l21 = v[0..n]            （下三角求解，解出 l21，長度 n）
      l22 = sqrt( v[n] − l21·l21 ) （若 ≤0 且有 epsilon 則 substitute）
```
> 注意 friedrich 的 `add_samples` **永遠在尾端插入**（`col_index = nb_old_inputs + row_index`，逐列遞增），故只需實作「尾端邊界化」這條路徑即可，無需支援任意位置插入。一次加多列就逐列呼叫 `insertColumn`。

**`inverse()` / `trace()` 注意**：`trace()` 回傳的是 `trace(A⁻¹)`（Rust 用 `cov_inv.trace()`，而 `cov_inv = covmat_cholesky.inverse()`，但 optimizer 內是先取 `inverse()` 再 `.trace()`）。建議 `CholeskyDecomposition.inverse()` 回傳 A⁻¹ 矩陣，trace 由呼叫端用 `algebra.trace()` 取，**避免命名混淆**——保留 `algebra.trace(matrix)` 為通用對角和即可，class 上可不提供 `trace()`。

### 2.5 `algebra.mjs` 的協方差矩陣輔助（對應 `algebra/mod.rs` 自由函式）

```js
// 用 kernel 算 m1 各 row × m2 各 row 的協方差。輸出 (m1.nrows × m2.nrows)。
// out[r][c] = kernel.kernel(m1[r], m2[c])
export function makeCovarianceMatrix(m1 /* number[][] */, m2 /* number[][] */, kernel)  // → number[][]

// 算 inputs 的協方差矩陣 + 對角 noise²，回傳其 CholeskyDecomposition。
// 對角項 += diagonalNoise² （注意是 noise 的平方）。epsilon 透傳。
export function makeCholeskyCovMatrix(inputs /* number[][] */, kernel, diagonalNoise, epsilon = null)  // → CholeskyDecomposition

// 對既有 cholesky 增量加入 nbNewInputs 個尾端 row（allInputs 的最後 nbNewInputs 列）。
// 逐列：算新欄協方差（長度 col_index+1），最後一項 += noise²，呼叫 insertColumn。就地更新 cholesky。
export function addRowsCholeskyCovMatrix(cholesky, allInputs /* number[][] */, nbNewInputs, kernel, diagonalNoise)

// 對每個 kernel 超參數，回傳一個對稱梯度矩陣（∂K/∂param）。回傳 number[][][]（長度 = kernel.nbParameters()）。
// 對 (r,c) 與 (c,r) 同填 kernel.gradient(inputs[r], inputs[c])[paramIdx]（對稱）。
export function makeGradientCovarianceMatrices(inputs /* number[][] */, kernel)  // → number[][][]
```

> **協方差矩陣對稱填法**：Rust 只算下三角再對 Cholesky 餵下三角；JS 端 `makeCovarianceMatrix(inputs, inputs, kernel)` 直接算滿矩陣即可（kernel 對稱），`cholesky` 只讀下三角部分也行。簡單起見 JS 算滿矩陣。

---

## 3. PRNG 與常態取樣（rand → JS）

放在 `multivariate_normal.mjs`（也可獨立但保持同檔即可）。指定**可種子化純 JS**實作：

```js
// mulberry32：32-bit 種子，回傳 () => number ∈ [0,1)
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller：用 rng()（uniform [0,1)）產生一個標準常態樣本 N(0,1)
export function standardNormal(rng) {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = rng();   // 避免 log(0)
  u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
```

**RNG 介面約定**：`sampleAt(...).sample(rng)` 的 `rng` 參數是一個 `() => number ∈ [0,1)` 的函式（即 mulberry32 回傳值）。為了確定性測試，呼叫端可 `const rng = mulberry32(42)`。
> 數值不要求與 Rust rand 逐位元一致（Rust 用不同演算法），只要求**統計正確 + 可種子化重現**。在 JSDoc 標明此語意決策。

---

## 4. Kernel 規格（`kernels.mjs`）

### 4.0 Kernel 介面（每個 kernel class 必備方法）
```js
nbParameters()                       // → number（常數）
isScalable()                         // → boolean（預設 false）
rescale(scale)                       // amplitude *= scale（僅 scalable kernel；非 scalable 呼叫應 throw）
kernel(x1 /* number[] */, x2 /* number[] */)   // → number  協方差值
gradient(x1, x2)                     // → number[]  對各超參數的梯度（順序見各 kernel）
getParameters()                      // → number[]
setParameters(params /* number[] */) // 由陣列設定（順序同 getParameters）
heuristicFit(inputs /* number[][] */, outputs /* number[] */)  // 預設 no-op；部分 kernel override
```
> **Sanitize 約定**（重要）：優化過程可能餵入非法（如負）參數。各 kernel 在 `kernel()`/`gradient()` 內對 `ampl`、`ls` 等取 `Math.abs()`，與 Rust 完全一致（見各 kernel 公式）。梯度對 amplitude 用 `Math.sign(this.ampl)`（Rust `signum()`）。**JS 對應**：`Math.abs`、`Math.sign`、`Math.exp`、`Math.sqrt`、`Math.pow`（`x.powi(3)` = `x**3`，`x.powf(d)` = `Math.pow(x,d)`）、`Math.tanh`、`Math.cosh`、`Math.log`（`.ln()`）。

### 4.1 共用 heuristic 輔助（自由函式，export 供 kernel 與測試用）
```js
// 所有不同樣本對之間歐式距離的平均：Σ_{i<j} ‖xᵢ−xⱼ‖ / (n(n−1)/2)
export function fitBandwidthMean(inputs /* number[][] */)  // → number
// 輸出的「nalgebra variance」：除以 N（母體變異數，非 N−1！）
export function fitAmplitudeVar(outputs /* number[] */)    // → number
```
> **`fitAmplitudeVar` 必須除以 N（樣本數），不是 N−1。** 已從 nalgebra 0.34.2 `statistics.rs::variance()` 源碼確認：`Σ(xᵢ−mean)² / n_elements`，`n_elements = self.len()`（doc 範例 `[1,4]` → 2.25 即 /2 驗證）。

### 4.2 逐一 kernel 規格

| Kernel | 參數(順序=get/setParameters) | 預設 | nbParams | scalable | cov(x,y) | gradient（順序） | heuristicFit |
|---|---|---|---|---|---|---|---|
| **SquaredExp** (= **Gaussian**, alias) | `[ls, ampl]` | ls=1, ampl=1 | 2 | **true** | `A·exp(−‖x−y‖²/(2·ls²))`，A=`abs(ampl)` | `[grad_ls, grad_ampl]` | ls=fitBandwidthMean, ampl=fitAmplitudeVar |
| **Exponential** | `[ls, ampl]` | ls=1, ampl=1 | 2 | **true** | `A·exp(−‖x−y‖/(2·ls²))`，A=`abs(ampl)`（注意分母是 `2·ls²` 不是 ls） | `[grad_ls, grad_ampl]` | ls=fitBandwidthMean, ampl=fitAmplitudeVar |
| **Matern1** (ν=3/2) | `[ls, ampl]` | ls=1, ampl=1 | 2 | **true** | A=`abs(ampl)`, l=`abs(ls)`, `x=√3·d/l`；`A·(1+x)·exp(−x)`，d=‖x−y‖ | `[grad_ls, grad_ampl]` | ls=fitBandwidthMean, ampl=fitAmplitudeVar |
| **Matern2** (ν=5/2) | `[ls, ampl]` | ls=1, ampl=1 | 2 | **true** | A=`abs(ampl)`, l=`abs(ls)`, `x=√5·d/l`；`A·(1 + x + 5d²/(3l²))·exp(−x)` | `[grad_ls, grad_ampl]` | ls=fitBandwidthMean, ampl=fitAmplitudeVar |
| **Linear** | `[c]` | c=0 | 1 | false | `x·y + c`（dot） | `[1]`（grad_c=1） | (預設 no-op) |
| **Polynomial** | `[alpha, c, d]` | alpha=1, c=0, d=1 | 3 | false | `(alpha·(x·y) + c)^d` | `[grad_alpha, grad_c, grad_d]`（見下） | no-op |
| **HyperTan** | `[alpha, c]` | alpha=1, c=0 | 2 | false | `tanh(alpha·(x·y) + c)` | `[grad_alpha, grad_c]`（見下） | no-op |
| **Multiquadric** | `[c]`（見 bug 註記） | c=0 | **2**（見 bug） | false | `hypot(‖x−y‖², c)` = `sqrt(‖x−y‖⁴ + c²)`（見 bug） | `[grad_c]`（見下） | no-op |
| **RationalQuadratic** | `[alpha, ls]` | alpha=1, ls=1 | 2 | false | `(1 + ‖x−y‖²/(2·alpha·ls²))^(−alpha)` | `[grad_alpha, grad_ls]`（見下） | no-op |

#### 各 kernel 梯度公式（逐式對應 Rust）

**SquaredExp**（`kernel.rs:563`）令 `d²=‖x−y‖²`, `A=abs(ampl)`, `e=exp(−d²/(2·ls²))`：
- `grad_ls = (d² · A · e) / ls³`
- `grad_ampl = sign(ampl) · e`

**Exponential**（`kernel.rs:668`）令 `d=‖x−y‖`, `A=abs(ampl)`, `e=exp(−d/(2·ls²))`：
- `grad_ls = (d · A · e) / ls³`
- `grad_ampl = sign(ampl) · e`

**Matern1**（`kernel.rs:774`）令 `d=‖x−y‖`, `A=abs(ampl)`, `l=abs(ls)`, `x=√3·d/l`：
- `grad_ls = (3 · A · d² · exp(−x)) / ls³`
- `grad_ampl = sign(ampl) · (1 + x) · exp(−x)`

**Matern2**（`kernel.rs:881`）令 `d=‖x−y‖`, `A=abs(ampl)`, `l=abs(ls)`, **`x=√5·d/ls`（注意此處除以 `self.ls` 原始值，非 `l`）**：
- `grad_ls = sign(ls) · A · ( (2l/3 + 1) + d·√5·((l²/3 + l + 1)/l²) ) · exp(−x)`
- `grad_ampl = sign(ampl) · (1 + x + 5d²/(3l²)) · exp(−x)`
> 忠實照搬：kernel() 內 `x=√5·d/l`，但 gradient() 內 `x=√5·d/self.ls`（用未取絕對值的 ls）。兩處 x 定義不同，**照 Rust 原樣分別實作**。

**Linear**（`kernel.rs:384`）：`grad_c = 1` → `[1]`。

**Polynomial**（`kernel.rs:459`）令 `x = x1·x2`, `inner = alpha·x + c`：
- `grad_c = d · inner^(d−1)`
- `grad_alpha = x · grad_c`
- `grad_d = ln(inner) · inner^d`
- 回傳 `[grad_alpha, grad_c, grad_d]`

**HyperTan**（`kernel.rs:979`）令 `x = x1·x2`：
- `grad_c = 1 / cosh(alpha·x + c)²`
- `grad_alpha = x · grad_c`
- 回傳 `[grad_alpha, grad_c]`

**Multiquadric**（`kernel.rs:1052`）：
- `grad_c = c / hypot(‖x−y‖, c)`  （注意：**非平方** norm，與 kernel() 用平方 norm 不一致）
- 回傳 `[grad_c]`

**RationalQuadratic**（`kernel.rs:1125`）令 `l=abs(ls)`, `d²=‖x−y‖²`：
- `grad_alpha = ((d² + 2l²·alpha)/(l²·alpha))^(−alpha) · ( 2^alpha·(1 − ln((d² + 2l²·alpha)/(2l²·alpha))) − (l²·2^(alpha+1)·alpha)/(d² + 2l²·alpha) )`
- `grad_ls = d² · (d²/(2·alpha·l·l) + 1)^(−alpha−1) / ls³`
- 回傳 `[grad_alpha, grad_ls]`

#### Multiquadric 的兩個 bug（**忠實照搬，勿修**）
1. `nbParameters()` 回傳 **2**，但實際只有一個參數 `c`。
2. `kernel()` 用 `‖x−y‖².hypot(c)`（平方距離），`gradient()` 用 `‖x−y‖.hypot(c)`（非平方），不一致。
3. `setParameters(params)` 在 Rust 寫 `self.c = parameters[1]`（讀 index 1，但 getParameters 回 `[c]` 是 index 0）。**JS 照搬 `this.c = params[1]`**，在 JSDoc 標 `// NOTE: faithful to Rust latent bug (reads index 1, getParameters returns index 0)`。

> 因為 Multiquadric / Linear / Polynomial / HyperTan 都 **不 scalable** 且 `heuristicFit` 為 no-op，且 `GaussianProcess.default` 只用 Gaussian，這些 bug 在預設路徑不會被觸發。仍須忠實保留以維持 API 完整與一致。

### 4.3 KernelSum / KernelProd / 組合（`kernels.rs:124-332`）

```js
export class KernelSum {  // k1 + k2
  constructor(k1, k2)
  nbParameters()  // k1.nbParameters() + k2.nbParameters()
  isScalable()    // k1.isScalable() && k2.isScalable()
  kernel(x,y)     // k1.kernel + k2.kernel
  gradient(x,y)   // [...k1.gradient, ...k2.gradient]（串接）
  rescale(s)      // k1.rescale(s); k2.rescale(s)
  getParameters() // [...k1.get, ...k2.get]
  setParameters(p)// k1.set(p[0..k1.nb]); k2.set(p[k1.nb..])
  heuristicFit(i,o)// 兩者都 fit
}
export class KernelProd {  // k1 · k2 (point-wise product)
  // nbParameters / getParameters / setParameters / heuristicFit 同 Sum
  isScalable()    // k1.isScalable() || k2.isScalable()
  kernel(x,y)     // k1.kernel · k2.kernel
  gradient(x,y)   // [ ...k1.gradient.map(g=>g·k2val), ...k2.gradient.map(g=>g·k1val) ]
                  // 其中 k1val=k1.kernel(x,y), k2val=k2.kernel(x,y)
  rescale(s)      // if k1.isScalable() k1.rescale(s) else k2.rescale(s)
}
// 便利建構（對應 Rust KernelArith 的 Add/Mul operator）：
export function addKernels(k1, k2)   // → new KernelSum(k1, k2)
export function mulKernels(k1, k2)   // → new KernelProd(k1, k2)
```
> Rust 的 `KernelArith(K)` wrapper + `+`/`*` operator overload 在 JS 無對應語法，改提供 `addKernels`/`mulKernels` 自由函式即可。`KernelSum`/`KernelProd` 的 `default()`（兩個子 kernel 各自 default）可用建構子 `new KernelSum(new T(), new U())` 表達，無需單獨 static。

---

## 5. Prior 規格（`priors.mjs`）

### 5.0 Prior 介面
```js
prior(inputs /* number[][] */)   // → number[]（每列一個 prior 值，長度 = inputs.length）
fit(inputs /* number[][] */, outputs /* number[] */)  // 預設 no-op；部分 prior override
// 建構：每個 prior 提供 static default(inputDimension) 與一般 constructor
```

| Prior | default(dim) | prior(inputs) | fit(inputs, outputs) |
|---|---|---|---|
| **ZeroPrior** | `new ZeroPrior()`（無狀態） | 回傳長度 = inputs.length 的全 0 陣列 | no-op |
| **ConstantPrior** | `new ConstantPrior(0)` | 回傳長度 = inputs.length、每項 = `this.c` | `this.c = mean(outputs)`（算術平均） |
| **LinearPrior** | `new LinearPrior(zeros(dim), 0)` | `inputs · weights + intercept`（每列：Σ_j inputs[r][j]·weights[j] + intercept） | 見下 |

**ConstantPrior** 建構子：`new ConstantPrior(c)`。`mean()` = `Σ/N`（nalgebra `mean` 也是 `sum/len`，與 JS 算術平均一致）。

**LinearPrior**（`prior.rs:108`）：
- 欄位：`weights: number[]`（長度 = 輸入維度）、`intercept: number`。
- 建構子：`new LinearPrior(weights, intercept)`。
- `prior(inputs)`：對每列 r 回傳 `dot(inputs[r], weights) + intercept`。
- `fit(inputs, outputs)`：解最小平方。Rust 在 inputs 左側插入一欄全 1（`insert_column(0, 1.)`）成為 `[1 | inputs]`，用 SVD 解 `[1|inputs]·w = outputs`，得 `w`（長度 = dim+1）。`intercept = w[0]`，`weights = w[1..]`。
  - JS：建 `augmented[r] = [1, ...inputs[r]]`，呼叫 `algebra.lstsqSolve(augmented, outputs)` 得 `w`；`this.intercept = w[0]`；`this.weights = w.slice(1)`。

> **input_dimension 來源**：builder 用 `training_inputs.ncols()` 作為 `PriorType.default(dim)` 的 dim。ZeroPrior / ConstantPrior 忽略 dim；LinearPrior 用它決定 weights 長度。

---

## 6. GaussianProcess 核心數學（`gaussian_process.mjs`）

### 6.0 內部狀態（對應 Rust struct，`mod.rs:59`）
```js
class GaussianProcess {
  prior            // Prior 實例
  kernel           // Kernel 實例
  noise            // number（噪音「標準差」，非變異數）
  choleskyEpsilon  // number | null
  trainingInputs   // ExtendableMatrix
  trainingOutputs  // ExtendableVector（存的是「outputs − prior(inputs)」殘差！）
  covmatCholesky   // CholeskyDecomposition
}
```
> **關鍵語意：`trainingOutputs` 存的是 prior 殘差**（`outputs − prior(inputs)`），不是原始 outputs。所有「拿回原始 outputs」的地方都要 `+ prior(inputs)`，所有重新存入都要 `− prior(inputs)`。

### 6.1 建構（`new`，對應 `mod.rs:142`）
```js
// new GaussianProcess(prior, kernel, noise, choleskyEpsilon, trainingInputs, trainingOutputs)
// trainingInputs: number[][], trainingOutputs: number[]（原始，未扣 prior）
```
步驟：
1. `assert(noise >= 0)`。
2. 轉成 matrix/vector（已是陣列則直接用）；`assert(inputs.length === outputs.length)`。
3. `trainingInputs = new ExtendableMatrix(inputsMatrix)`。
4. **`trainingOutputs = new ExtendableVector( outputs − prior.prior(inputsMatrix) )`**（存殘差）。
5. `covmatCholesky = makeCholeskyCovMatrix(inputsMatrix, kernel, noise, choleskyEpsilon)`。

### 6.2 `addSamples(inputs, outputs)`（O(n²)，`mod.rs:173`）
```js
addSamples(inputs, outputs)  // inputs: number[]|number[][], outputs: number|number[]
```
步驟（用 `conversion.toMatrix`/`toVector`，**不消耗** input 型別資訊，用 `to_dmatrix`/`to_dvector` 而非 into 版）：
1. 轉 matrix/vector；`assert(inputs.nrows === outputs.nrows)`；`assert(inputs.ncols === trainingInputs.ncols)`。
2. `residual = newOutputs − prior.prior(newInputs)`。
3. `trainingInputs.addRows(newInputs)`；`trainingOutputs.addRows(residual)`。
4. `addRowsCholeskyCovMatrix(covmatCholesky, trainingInputs.asMatrix(), newInputs.length, kernel, noise)`（增量更新 Cholesky）。

### 6.3 `likelihood()`（`mod.rs:196`）
公式：`−½ ( dataFit + complexityPenalty + normConst )`
- `output = trainingOutputs.asVector()`（殘差）
- `ol = solveLowerTri(L, output)`，`dataFit = normSquared(ol)`（= outputᵀ·K⁻¹·output）
- `complexityPenalty = Σ_r ln| kernel.kernel(inputs[r], inputs[r]) + noise² |`（對每列自協方差 + noise²，取絕對值的 ln，再求和）
- `normConst = n · ln(2π)`，n = 樣本數
- 回傳 `−(dataFit + complexityPenalty + normConst) / 2`

### 6.4 `predict(inputs)`（mean，`mod.rs:226`）
公式：`prior + cov(input,train)·K⁻¹·output`
1. 轉 inputs matrix；`assert(ncols 一致)`。
2. `weights = makeCovarianceMatrix(trainingInputs.asMatrix(), inputs, kernel)`（形狀 nTrain × nInput）。
3. `weights = covmatCholesky.solve(weights)`（就地/回新，解 K·weights = cov；逐欄）。
4. `priorVec = prior.prior(inputs)`（長度 nInput）。
5. `mean[i] = priorVec[i] + Σ_t weights[t][i] · trainingOutputs[t]`（即 `weightsᵀ · trainingOutputs + prior`，對應 `gemm_tr`）。
6. 回傳：用 `conversion.fromVector(mean, isSingle)`（單點回 number，多點回 number[]）。

### 6.5 `predictVariance(inputs)`（`mod.rs:248`）
公式：`diag( cov(input,input) − cov(input,train)·K⁻¹·cov(train,input) )`
1. `covTrainInputs = makeCovarianceMatrix(trainingInputs.asMatrix(), inputs, kernel)`（nTrain × nInput）。
2. `kl = solveLowerTri(L, covTrainInputs)`（解 L·kl = covTrainInputs，逐欄）。
3. 對每個 input i：`baseCov = kernel.kernel(inputs[i], inputs[i])`；`predictedCov = normSquared(kl 的第 i 欄)`；`variance[i] = baseCov − predictedCov`。
4. 回傳 `fromVector(variances, isSingle)`。

### 6.6 `predictMeanVariance(inputs)`（`mod.rs:290`）
1. `covTrainInputs = makeCovarianceMatrix(train, inputs, kernel)`。
2. `weights = covmatCholesky.solve(covTrainInputs)`（解 K·weights = covTrainInputs）。
3. mean：同 6.4 用 weights（`mean[i] = prior[i] + Σ_t weights[t][i]·trainingOutputs[t]`）。
4. variance：對每個 i，`baseCov = kernel.kernel(inputs[i], inputs[i])`，`predictedCov = dot(covTrainInputs 第 i 欄, weights 第 i 欄)`，`variance[i] = baseCov − predictedCov`。
5. 回傳 `[fromVector(mean), fromVector(variance)]`（tuple → JS 回 2-array）。

### 6.7 `predictCovariance(inputs)`（`mod.rs:329`，**永遠回 number[][] 矩陣**，不經 fromVector）
1. `covTrainInputs = makeCovarianceMatrix(train, inputs, kernel)`。
2. `covInputsInputs = makeCovarianceMatrix(inputs, inputs, kernel)`（nInput × nInput）。
3. `kl = solveLowerTri(L, covTrainInputs)`。
4. `result = covInputsInputs − klᵀ·kl`（對應 `gemm_tr(-1, kl, kl, 1)`）。
5. 回傳 `result`（number[][]）。

### 6.8 `sampleAt(inputs)`（`mod.rs:371`）→ `MultivariateNormal`
1. `covTrainInputs = makeCovarianceMatrix(train, inputs, kernel)`。
2. `weights = covmatCholesky.solve(covTrainInputs)`。
3. `cov = makeCovarianceMatrix(inputs, inputs, kernel) − covTrainInputsᵀ·weights`（對應 `gemm_tr(-1, covTrainInputs, weights, 1)`）。
4. mean：`priorVec = prior.prior(inputs)`；`mean[i] = priorVec[i] + Σ_t weights[t][i]·trainingOutputs[t]`。
5. 回傳 `new MultivariateNormal(mean, cov, isSingle)`（見 §8）。

### 6.9 `fitParameters(fitPrior, fitKernel, maxIter, convergenceFraction, maxTime)`（`mod.rs:406`）
`maxTime`：Rust 用 `chrono::Duration`（秒）。**JS 改用毫秒 number**（預設 3600·1000 = 3600000）。優化器內用 `Date.now()` 計時。
步驟：
1. **若 fitPrior**：
   a. 拿回原始 outputs：`originalOutputs = trainingOutputs.asVector() + prior.prior(trainingInputs.asMatrix())`。
   b. `prior.fit(trainingInputs.asMatrix(), originalOutputs)`。
   c. 重算殘差：`residual = originalOutputs − prior.prior(trainingInputs.asMatrix())`；`trainingOutputs.assign(residual)`。
   d. **若 !fitKernel**：重建 `covmatCholesky = makeCholeskyCovMatrix(...)`（因 noise/kernel 沒變但需與 c 的新殘差一致地重訓；Rust 確實在此重建）。
2. **若 fitKernel**：
   - `if kernel.isScalable()` → `scaledOptimizeParameters(maxIter, convergenceFraction, maxTime)`；
   - `else` → `optimizeParameters(maxIter, convergenceFraction, maxTime)`。

> **prior 加回/扣除的順序**（§5 規則的具體落點）：殘差表示法下，fit prior 必先 `+prior_old` 還原 → `prior.fit` 改變 prior → `−prior_new` 重新存殘差。predict/sampleAt 一律最後 `+prior(inputs)`。

---

## 7. Optimizer（`optimizer.mjs`，ADAM 梯度上升 log-likelihood）

掛載方式：把 `optimizeParameters` / `scaledOptimizeParameters` / `gradientMarginalLikelihood` / `scaledGradientMarginalLikelihood` 實作為**接受 gp 物件的自由函式**並在 `gaussian_process.mjs` 內 `import` 後當方法呼叫（或用 `Object.assign(GaussianProcess.prototype, {...})` mixin）。任選一種，但對外行為一致。

### 7.1 `gradientMarginalLikelihood(gp)`（非 scalable，`optimizer.rs:24`）
公式：`½ ( alphaᵀ·dp·alpha − trace(K⁻¹·dp) )` 每參數，最後加 noise 梯度。
1. `covInv = gp.covmatCholesky.inverse()`（K⁻¹）。
2. `alpha = covInv · trainingOutputs`（matVec）。
3. 對每個 `covGradient` ∈ `makeGradientCovarianceMatrices(inputs, kernel)`：
   - `dataFit = Σ_c alpha[c] · dot(alpha, covGradient 的第 c 欄)` = `alphaᵀ·covGradient·alpha`。
   - `complexityPenalty = Σ_r dot(covInv 第 r 列, covGradient 第 r 欄)` = `trace(covInv·covGradient)`。
   - push `(dataFit − complexityPenalty) / 2`。
4. noise 梯度：`dataFit = dot(alpha, alpha)`；`complexityPenalty = trace(covInv)`；`noiseGradient = noise · (dataFit − complexityPenalty)`；push。
5. 回傳 results（長度 = nbParams + 1，最後一項是 noise）。

### 7.2 `optimizeParameters(gp, maxIter, convergenceFraction, maxTime)`（`optimizer.rs:69`）
ADAM 常數：`beta1=0.9, beta2=0.999, epsilon=1e-8, learningRate=0.1`。
1. `parameters = kernel.getParameters().map(p => p === 0 ? epsilon : p)`（避免 0 卡死）。
2. `parameters.push( Math.log(noise) )`（noise 進 log 空間）。
3. `meanGrad = zeros, varGrad = zeros`（長度 = parameters.length）。
4. `timeStart = Date.now()`。
5. for `i = 1..=maxIter`：
   a. `gradients = gradientMarginalLikelihood(gp)`。
   b. 修正 noise 梯度的 log 空間：`gradients[last] *= gp.noise`。
   c. `hadSignificantProgress = false`。
   d. for p in 0..parameters.length：
      - `meanGrad[p] = beta1·meanGrad[p] + (1−beta1)·gradients[p]`
      - `varGrad[p] = beta2·varGrad[p] + (1−beta2)·gradients[p]²`
      - `mHat = meanGrad[p] / (1 − beta1**i)`
      - `vHat = varGrad[p] / (1 − beta2**i)`
      - `delta = learningRate · mHat / (sqrt(vHat) + epsilon)`
      - `hadSignificantProgress ||= abs(delta) > convergenceFraction`
      - `parameters[p] *= (1 + delta)`
   e. `kernel.setParameters(parameters)`（kernel 只讀前 nbParams 個；JS 端可傳整個陣列，kernel.setParameters 自取前綴——或在呼叫前 slice，但須保證 kernel 只用自己那段。建議 kernel.setParameters 內部只讀所需 index，與 Rust 一致）。
   f. `gp.noise = Math.exp(parameters[last])`（出 log 空間）。
   g. 重建 `gp.covmatCholesky = makeCholeskyCovMatrix(inputs, kernel, noise, choleskyEpsilon)`。
   h. **停止條件**：`if (!hadSignificantProgress) || (Date.now() − timeStart > maxTime) break`。

### 7.3 `scaledGradientMarginalLikelihood(gp)`（scalable，`optimizer.rs:150`）
回傳 `[scale, gradients]`（**不含 noise 梯度**）。
1. `covInv = inverse()`；`alpha = covInv · trainingOutputs`。
2. `scale = dot(trainingOutputs, alpha) / n`（n = 樣本數）。
3. 對每個 covGradient：
   - `dataFit = (alphaᵀ·covGradient·alpha) / scale`（**除以 scale**，與非 scalable 不同）。
   - `complexityPenalty = trace(covInv·covGradient)`（同上）。
   - push `(dataFit − complexityPenalty) / 2`。
4. 回傳 `[scale, results]`（results 長度 = nbParams，無 noise）。

### 7.4 `scaledOptimizeParameters(gp, maxIter, convergenceFraction, maxTime)`（`optimizer.rs:202`）
1. `parameters = kernel.getParameters().map(p => p===0 ? epsilon : p)`（**不 push noise**）。
2. `meanGrad/varGrad = zeros(parameters.length)`。
3. for `i = 1..=maxIter`：
   a. `[scale, gradients] = scaledGradientMarginalLikelihood(gp)`。
   b. for p：同 7.2.d 的 ADAM 更新（`parameters[p] *= 1 + delta`）。
   c. `kernel.setParameters(parameters)`。
   d. `kernel.rescale(scale)`；`gp.noise *= scale`。
   e. **`parameters = kernel.getParameters()`**（重新取回，因 rescale 改了 amplitude）。
   f. 重建 `covmatCholesky`。
   g. 停止條件同 7.2.h。

> 數值上 ADAM 對 `Math.pow(beta, i)`、`**` 等與 Rust `powi` 等價。`maxTime` 比較用毫秒。`>` 而非 `>=`（對齊 Rust `signed_duration_since > max_time`）。

---

## 8. MultivariateNormal（`multivariate_normal.mjs`，`multivariate_normal.rs`）

```js
export class MultivariateNormal {
  // covariance 必須對稱正定；建構時做 Cholesky 取下三角 L。失敗 → throw（對齊 Rust expect）。
  constructor(mean /* number[] */, covariance /* number[][] */, isSingle /* boolean */)
  mean()                  // → number | number[]（依 isSingle，經 conversion.fromVector）
  sample(rng /* ()=>[0,1) */)  // → number | number[]
}
```
`sample(rng)`：
1. `z = mean.map(() => standardNormal(rng))`（每維一個 N(0,1)）。
2. `sampleVec = mean + L·z`（`L` 下三角；`matVec(L, z)` 後逐項加 mean）。
3. 回傳 `fromVector(sampleVec, isSingle)`。

> `isSingle` 旗標承載「輸入是單點 vs 多點」資訊，決定 `mean()`/`sample()` 回 number 還是 number[]，等價 Rust 的 `PhantomData<T>` + `T::from_dvector`。

---

## 9. Conversion（`conversion.mjs`，輸入彈性）

Rust 的 `Input` trait 用型別系統區分 `Vec<f64>`（單點，輸出 f64）與 `Vec<Vec<f64>>`（多點，輸出 Vec<f64>）。JS 無多載，改用**執行期偵測**：

```js
// 判斷是否為「單點」輸入：number[]（元素為 number）為單點；number[][]（元素為陣列）為多點。
export function isSingle(input)  // → boolean
//   Array.isArray(input) && input.length>0 && typeof input[0] === 'number'  → 單點
//   Array.isArray(input) && Array.isArray(input[0])                          → 多點

// 把輸入正規化為 matrix (number[][])：單點 [a,b] → [[a,b]]（1×d）；多點原樣。
export function toMatrix(input)  // → number[][]

// 把訓練輸出正規化為 vector (number[])：單點輸出（number）→ [v]；多點（number[]）原樣。
export function toVector(output) // → number[]

// 把內部 DVector 結果轉回使用者輸出：single → 取 v[0]（number）；否則回 number[]。
export function fromVector(v /* number[] */, single /* boolean */)  // → number | number[]
```

**對應關係**：

| JS 輸入 | Rust 對應 | toMatrix | 輸出（predict 等） |
|---|---|---|---|
| `[a, b, c]`（單一多維點） | `Vec<f64>` | `[[a,b,c]]` (1×3) | `number`（single=true） |
| `[[a],[b],[c]]`（3 個 1 維點） | `Vec<Vec<f64>>` | 原樣 (3×1) | `number[]` |

**single 判定要點**：
- 訓練資料（`GaussianProcess.default` / builder `new`）：`training_inputs` 多為 `number[][]`；`training_outputs` 為 `number[]`。
- 預測時的 single 旗標來自**該次呼叫的 inputs**：`isSingle(inputs)` → 決定 `predict` 回 number 或 number[]。
- `predictCovariance` **永遠回 number[][]**，不套 fromVector（對齊 Rust 永遠回 `DMatrix`）。

> 邊界：1 維單點 `[1.0]` 會被判為單點（element 是 number）→ `toMatrix` = `[[1.0]]`，輸出 number。多個 1 維點 `[[1.0],[2.0]]` → 多點，輸出 number[]。這與 Rust `vec![1.]`（Vec<f64> 單點）vs `vec![vec![1.],vec![2.]]`（多點）完全對齊。

---

## 10. Builder 與公開 API

### 10.1 `GaussianProcessBuilder`（`builder.rs`）
鏈式 setter，最後 `train()`。欄位與預設：
```js
class GaussianProcessBuilder {
  // new(trainingInputs, trainingOutputs)
  //   prior = PriorType.default(inputsMatrix.ncols)         // 預設 ConstantPrior
  //   kernel = new KernelType()                              // 預設 Gaussian/SquaredExp
  //   noise = 0.1 * sqrt( fitAmplitudeVar(outputs) )         // 10% 輸出 std（見下）
  //   choleskyEpsilon = null
  //   shouldFitKernel = false, shouldFitPrior = false
  //   maxIter = 100, convergenceFraction = 0.05, maxTime = 3600000 (ms)
  setPrior(prior)            // 換 prior（回新 builder 或就地皆可，但回 this 以鏈式）
  setNoise(noise)           // assert(noise>=0)
  setKernel(kernel)
  setCholeskyEpsilon(eps)   // number | null
  setFitParameters(maxIter, convergenceFraction)
  fitKernel()               // shouldFitKernel = true
  fitPrior()                // shouldFitPrior = true
  train()                   // → GaussianProcess（見下）
}
```
**`train()`**（`builder.rs:189`）：
1. `if shouldFitKernel` → `kernel.heuristicFit(trainingInputs, trainingOutputs)`（用**原始** outputs，因 builder 尚未扣 prior）。
2. `gp = new GaussianProcess(prior, kernel, noise, choleskyEpsilon, trainingInputs, trainingOutputs)`。
3. `gp.fitParameters(shouldFitPrior, shouldFitKernel, maxIter, convergenceFraction, maxTime)`。
4. 回傳 gp。

**noise 預設 heuristic**（`builder.rs:73`）：`noise = 0.1 * Math.sqrt( row_variance(outputs) )`。
- `row_variance(outputs)[0]` = 把 outputs 當「一個 column」算 variance = `Σ(yᵢ−ȳ)²/N`（**除以 N**）。即 `fitAmplitudeVar(outputs)`。
- 故 `noise = 0.1 * Math.sqrt( fitAmplitudeVar(trainingOutputs) )`。**務必除以 N（母體 std 的 10%）**。

### 10.2 `GaussianProcess.default(inputs, outputs)`（`mod.rs:96`）
```js
// 靜態：等價 builder(inputs, outputs).fitKernel().fitPrior().train()
static default(inputs, outputs) {
  return GaussianProcess.builder(inputs, outputs).fitKernel().fitPrior().train();
}
static builder(inputs, outputs) {
  return new GaussianProcessBuilder(inputs, outputs); // 預設 Gaussian kernel + ConstantPrior
}
```
> 注意 JS 的 `default` 是保留字，**不能**當方法名直接寫 `default()`？實際上 `static default()` 在 class 內合法（`default` 是合法 method 名，僅當識別字/import 時受限）。若 linter 不喜，可同時 export 別名 `static fromData(inputs, outputs)` 並讓 `default` 指向它。**主要 API 名沿用 `default`**，並額外 export `fromData` 作為安全別名（在 JSDoc 註明）。

### 10.3 `index.mjs` 公開 API（對應 `lib.rs` re-export）
```js
export { GaussianProcess, GaussianProcessBuilder } from './gaussian_process.mjs';
export { MultivariateNormal } from './multivariate_normal.mjs';
export {
  SquaredExp, Gaussian, Exponential, Matern1, Matern2,
  Linear, Polynomial, HyperTan, Multiquadric, RationalQuadratic,
  KernelSum, KernelProd, addKernels, mulKernels,
  fitBandwidthMean, fitAmplitudeVar
} from './kernels.mjs';
export { ZeroPrior, ConstantPrior, LinearPrior } from './priors.mjs';
// （algebra / conversion 視需要 re-export，但非主要公開面）
```
`Gaussian` 是 `SquaredExp` 的 alias：`export const Gaussian = SquaredExp;`（或 `export { SquaredExp as Gaussian }`）。

---

## 11. 驗收（移植正確性檢查點）

各 agent 完成後，整合測試應對齊 `tests/integration.rs`（用 `GaussianProcess.default`）：
1. **內插 + 訓練點低變異數**：在訓練點上 `predict` ≈ 訓練 outputs（誤差 < 0.2）；`predictVariance` < 0.5。
2. **遠離資料變異數增大**：`predictVariance([10])` > `predictVariance([2.01])`。
3. **predictMeanVariance 與分開呼叫一致**：mean/variance 差 < 1e-10。
4. **協方差矩陣**：對稱（< 1e-10）；對角線 == `predictVariance`（< 1e-10）；尺寸 n×n。
5. **addSamples 移動預測**：在 x=5 觀測 y=10 後，`predict([5])` 更靠近 10。

數值容忍：與 Rust 版相比，非優化路徑（predict/variance/covariance）應到 ~1e-9；優化路徑（fitParameters / ADAM）因浮點累積與計時差異允許較寬鬆但**收斂方向與量級需一致**。取樣（sampleAt.sample）僅要求統計正確 + 可種子化重現，不要求逐位元等於 Rust。

---

## 12. 移植語意決策 / 已知疑點（彙整）

1. **noise / amplitude variance 除以 N（非 N−1）**：已從 nalgebra 0.34.2 源碼確認（`statistics.rs::variance` 用 `self.len()`）。`fitAmplitudeVar` 與 builder noise heuristic 都除以 N。
2. **trainingOutputs 存的是 prior 殘差**：所有 predict/sample 最後 `+prior(inputs)`；fitParameters(fitPrior) 先 `+prior_old` 再 `−prior_new`。
3. **Multiquadric 的 3 個 latent bug 忠實照搬**（nbParameters=2、kernel 用平方距離 hypot、setParameters 讀 index 1），JSDoc 標註不修。
4. **Matern2 gradient 的 `x` 用未取絕對值的 `self.ls`**（與 kernel() 的 `l=abs(ls)` 不同），照搬。
5. **maxTime 由 chrono::Duration（秒）改為毫秒 number**，預設 3600000；優化器用 `Date.now()`，比較用 `>`。
6. **PRNG 不與 Rust rand 逐位元一致**：用 mulberry32 + Box-Muller，可種子化、統計正確。
7. **Cholesky epsilon（substitute）**：對齊 nalgebra `new_with_substitute`——僅當某對角項 ≤ 0 時以 epsilon 取代；epsilon=null 時失敗 throw。
8. **kernel.setParameters 讀「前綴」語意**：KernelSum/Prod 用 slice 切給子 kernel；單一 kernel 從 index 0 起讀自己需要的個數。optimizer 把整個 parameters 陣列傳給 `kernel.setParameters`（含末尾 noise log 值），故**單一 kernel 的 setParameters 必須只讀前 nbParameters 個 index，忽略多餘尾巴**（Rust 行為，因 slice 邊界；JS 端 kernel.setParameters 只 `params[0..nbParams]`）。
9. **`GaussianProcess.default` 命名**：`default` 為 JS class static method 合法名，沿用；另 export `fromData` 別名以防工具鏈不適。
10. **column-major vs row-major**：JS 一律 row-major `number[][]`（每列一樣本），不模擬 nalgebra column-major 記憶體；數學等價即可。
11. **insertColumn 僅需尾端邊界化路徑**（friedrich 只在尾端插入），無需任意位置插入的完整 nalgebra 實作。
12. **lstsqSolve（LinearPrior.fit）**：Rust 用 SVD，JS 允許用 normal equations 或自寫 SVD，只要通過 LinearPrior 整合測試；數值近似可接受。

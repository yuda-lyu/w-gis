# friedrich-js 改用 mathjs 是否能加速？實測裁決報告

## 結論（開門見山）

**不能。實測證明改用 mathjs 只會變慢，不會加速，而且還要額外付資料轉換稅。不建議換。**

固定種子產生的對稱正定矩陣、`number[][]` ↔ mathjs 端到端對比下（mathjs 15.2.0、Node v24.14.0、結果與 friedrich 交叉驗證差 ~1e-17 機器精度），**16 個測試組合（4 運算 × 4 尺寸）沒有任何一項 mathjs 比 friedrich 快**——連最理想的「資料已是 mathjs DenseMatrix、不計轉換」的純運算端也全輸。

更關鍵的是：GP 的 train / predict / fit 主成本全部落在 **Cholesky 分解與三角求解**上，而 **mathjs 根本沒有 Cholesky**（`Object.keys(mathjs)` 實測無任何 `/chol/i` 鍵，只有 LU 的 `lusolve` / `lup` / `inv`）。最熱的運算連「換」的選項都不存在。

---

## 逐運算裁決表

下表的「實測倍率」為 mathjs / friedrich 的耗時比（median ms，取 N=300 與 N=1000 兩個代表尺寸；數值越大代表 friedrich 越快）。「mathjs 純運算」＝資料已是 DenseMatrix、不計轉換的最理想端。

| 運算 | mathjs 有無對應 | 實測倍率（mathjs 慢幾倍，純運算端） | 裁決 |
|---|---|---|---|
| **cholesky** | ⛔ 無對應 | 無法直接比（mathjs 無此函式） | ⛔ 無對應、換不了 |
| **solveLowerTri**（前代入） | ⛔ 無對應 | — | ⛔ 無對應、換不了 |
| **solveUpperTri**（後代入） | ⛔ 無對應 | — | ⛔ 無對應、換不了 |
| **choleskySolve**（解線性系統） | △ 僅 `math.lusolve`（LU，語意不同） | N=300：34×；N=1000：28× 慢 | ❌ 跨演算法可解但全面變慢 |
| **choleskyInverse**（反矩陣） | △ 僅 `math.inv`（LU 路徑，語意不同） | N=300：40×；N=1000：24× 慢 | ❌ 跨演算法可解但全面變慢 |
| **CholeskyDecomposition.insertColumn**（增量更新） | ⛔ 無對應 | — | ⛔ 無對應、換不了 |
| **lstsqSolve**（最小二乘） | ⛔ 無直接 lstsq（mathjs 無 Cholesky 正規方程式路徑） | — | ⛔ 無對應、換不了（且為 cold 路徑） |
| **matMul**（矩陣乘） | ✅ `math.multiply` | N=300：10×；N=1000：14× 慢 | ❌ 可換但變慢 |
| **matVec**（矩陣×向量） | ✅ `math.multiply` | N=300：9.8×；N=1000：9× 慢（含轉換達 28–54×） | ❌ 可換但變慢 |
| **transpose** | ✅ `math.transpose` | （同屬 mathjs 物件層開銷區，無正收益） | ❌ 可換但無收益 |
| **dot** | ✅ `math.dot` | （O(n) 小運算，typed dispatch 開銷反而放大） | ❌ 可換但無收益 |
| **trace** | ✅ `math.trace` | （cold 路徑，換了無感） | ❌ 可換但無收益 |
| **normSquared** | △ 無 `normSquared`，可 `math.dot(v,v)` | （包在 kernel n² 迴圈內，dispatch 開銷會被放大） | ❌ 可換但變慢 |

**沒有任何一格是「可換且加速 ✅」。** 全部落在「❌ 可換但變慢／無收益」或「⛔ 無對應」。

### 核心瓶頸點明

GP 的 **train / fit 熱路徑**（`optimizeParameters` / `scaledOptimizeParameters`，預設最多 100 次 ADAM iteration），每個 iteration 主成本由重到輕：

1. `makeCholeskyCovMatrix`（迴圈末尾重建）= O(n²) kernel eval + **O(n³) Cholesky 分解** → 單次最貴
2. `choleskyInverse`（gradient 開頭取 K⁻¹）= O(n³)，等同 n 次 `choleskySolve`
3. `makeGradientCovarianceMatrices` + αᵀ·dp·α 與 trace(K⁻¹·dp) = O(n²·nbParams)

**predict 熱路徑**主成本：`makeCovarianceMatrix` → `choleskySolve`（weights = K⁻¹·cov_train_inputs）→ `predict_covariance` 的 `matMul(transpose(kl), kl)`。

這些 O(n³) / O(n²·k) 的主成本**全部建立在 Cholesky 分解與其前/後三角代入上**——也就是 mathjs 完全沒有對應函式的那一組。可換的 6 個運算（matMul / matVec / dot / transpose / trace / normSquared）**沒有一個落在最熱的 O(n³) 路徑上**，即使換了、即使 mathjs 不變慢，對總時間的影響也微乎其微。實際上它們還全部變慢。

---

## mathjs 為何（不）加速：機制分析

mathjs 慢不是偶然，是其架構設計的必然結果。四個疊加的開銷來源：

1. **typed-function 動態分派開銷**：mathjs 所有函式（含 `multiply`、`det`）每次呼叫都要做型別判斷（number / BigNumber / Complex / Fraction / Matrix / Unit…），決定走哪條實作。維護者在 discussion #3103 明確確認：即使是 compile 過的 mathjs 函式，仍比 `new Function` 慢約 15 倍。對「在 n² 迴圈內被呼叫 n² 次」的 kernel/小運算，這層 per-call 開銷被乘倍放大。

2. **DenseMatrix 的 array-of-arrays 儲存**：mathjs 內部以巢狀 JS Array 儲存（source 確認 `this._data[i][j]` 遞迴存取），**不是 flat Float64Array**。因此完全無法享有 cache locality。沒有「傳入 Float64Array 就走 flat buffer 快路徑」的機制——`datatype` 參數僅為 metadata 標記，不改變底層儲存。

3. **純 JS、無 BLAS / SIMD / 多執行緒**：mathjs 沒有任何原生加速。維護者在 discussion #2744 評估 WASM（AssemblyScript POC）後未採用，因 WASM-JS bridge 開銷有時比 JS JIT 還慢；GPU 路徑（issue #1788）至今仍是 open feature request。對照之下，friedrich 的手寫三重迴圈 + 行快取對 V8 的 JIT 非常友善，這是它在純運算端就贏 3–14× 的主因。

4. **轉換成本（number[][] ↔ mathjs）**：呼叫端是 `number[][]`，每次進出 mathjs 都要 O(n²) 包裝/解包。實測在小資料量級非常明顯：matVec N=500 的轉換把倍率從 18× 推到 82×。大矩陣因 O(n²) 轉換相對 O(n³) 運算佔比下降，pure 與 conv 兩欄才接近。但只要實務上用 mathjs 取代 friedrich，這層稅必然存在。

**一個誠實的但書**：solve / inv 的 24–41× 巨大倍率**不能全歸功於「手寫比函式庫快」**。friedrich 用對稱正定專用的 O(N³/3) Cholesky，mathjs 用通用的 O(2N³/3) LU——對「對稱正定」這個前提，Cholesky 本就該贏約 2×。倍率中有一部分是「選對演算法」、一部分才是「mathjs 物件層開銷」。但無論如何拆分，**結論方向不變：換 mathjs 全面更慢。**

---

## 真正的加速路徑（這才是「加速」的實際解）

既然瓶頸是純 JS 的 Cholesky 分解與三角求解、而 mathjs 幫不上忙，真正能加速的方向如下，按「投入產出比」排序：

### 1. Float64Array 取代 number[][]（cache / GC 友善）— 推薦優先

- **適用情境**：所有尺寸，尤其 N≥300 的 train/fit/predict 熱路徑。改動範圍最可控、不引入外部依賴。
- **做法**：把 `number[][]` 改為單一 flat `Float64Array`（row-major，`A[i*n+j]`）。連續記憶體 → V8 cache locality 大幅改善、消除巢狀陣列的 GC 壓力與 pointer-chasing。
- **預期效益量級**：純 JS 數值運算改 flat typed array 常見 **1.5–3×** 加速（視運算 cache-bound 程度），對 O(n³) 的 Cholesky / matMul 收益最明顯。**這是純 JS 上限內最划算的一步。**

### 2. 區塊化 / 迴圈微調 Cholesky 與三角求解

- **適用情境**：搭配第 1 點一起做（flat buffer 是 blocking 的前提）。N 偏大（≥500）時收益較明顯。
- **做法**：blocked Cholesky（分塊讓內層工作集塞進 cache）、三角求解的 loop ordering 調整（ikj / 行快取）、避免 `transpose` 每次 solve 都重建 Lᵀ（`choleskySolve` 目前每次都建一份）。
- **預期效益量級**：額外 **1.2–2×**，與第 1 點部分重疊（都靠改善 cache 行為）。屬於微調，邊際遞減。

### 3. WASM-BLAS / WASM 數值庫 — 大矩陣的真正解

- **適用情境**：N 很大（≥500、特別是 ≥1000）且 train/fit 反覆執行、運算量遠大於 JS↔WASM 邊界轉換成本時。小矩陣不划算（bridge 開銷吃掉收益，正是 mathjs 維護者放棄 WASM 的原因）。
- **做法**：emscripten 移植 LAPACK/BLAS（`emlapack`、`nlapack`）、`@stdlib` 的 wasm BLAS、或 eigen-js（含 Cholesky）。LAPACK 的 `dpotrf`（Cholesky 分解）+ `dpotrs`（solve）正好直接對應 GP 需求。
- **預期效益量級**：核心 O(n³) 在大矩陣上 **5–50×**（接近 native BLAS 的 cache-blocked + SIMD），但要扣掉 number[][] ↔ flat buffer 的邊界轉換。**門檻**：需評估 bundle 體積與 JS↔WASM 邊界呼叫頻率，且 friedrich 的增量 Cholesky（`insertColumn`）若要保留得自行接。

### 4. GPU（gpu.js / WebGPU）— 僅超大矩陣

- **適用情境**：N 數千以上、且同一批運算重複多次（攤平 GPU kernel 編譯與資料上傳成本）。社群 benchmark 中 GPU.js 在大矩陣乘法可達 ~6ms vs mathjs ~3469ms。
- **預期效益量級**：超大規模 matMul 可達 **10²–10³×**，但 Cholesky 分解的依賴鏈（前後三角代入有強順序性）對 GPU 並行不友善，收益遠不如 matMul。對 GP 的實際瓶頸（Cholesky）幫助有限。對本案多數實務尺寸（N≤1000）**過度工程，不推薦**。

### 5. 維持現狀

- **適用情境**：N 通常 ≤ 數百、且目前效能可接受。
- **理由**：friedrich 的手寫 Float64 三重迴圈 + 對稱正定 Cholesky **已經非常接近純 JS 的合理上限**——它在每一項實測都壓倒 mathjs。若不導入 WASM/GPU，剩下能榨的只有第 1、2 點的 cache 友善改寫（約 2–4× 合計），屬漸進改善而非數量級突破。

---

## 最終建議（一句話）

**不要改用 mathjs（無 Cholesky、且實測全面慢 3–41×並另付轉換稅）；若真要加速，先把 `number[][]` 換成 flat `Float64Array` 並區塊化 Cholesky（純 JS 上限內最划算、約 2–4×），只有在大矩陣反覆運算的場景才考慮導入 WASM-BLAS（如 LAPACK `dpotrf`）。**

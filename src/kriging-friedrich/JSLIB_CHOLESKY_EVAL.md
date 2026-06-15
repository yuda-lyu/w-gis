# friedrich-js 改用專業 JS 庫做 Cholesky 能不能加速？實測裁決報告

## 結論（開門見山）

**不能。沒有任何「npm 直裝即用」的 JS 庫能加速 friedrich-js 的手寫 Cholesky。** 純 JS 候選（ml-matrix / numeric.js）實測在每一個尺寸、每一項運算上都比 friedrich **慢或頂多持平**；唯一理論上可能加速的 WASM 候選（eigen）因 prebuilt heap 太小，**連最低目標 N=100 的「分解＋解」都跑不起來**，工程上不可用。

固定種子產生的對稱正定矩陣、`number[][]` 端到端對比（Node、median ms、結果與 friedrich 交叉驗證最大絕對差 3e-18 ~ 9e-18 機器精度）下：

- **ml-matrix**（唯一有 Cholesky＋solve＋積極維護＋ESM＋typed-array 的純 JS 庫）：分解＋解倍率 0.49–1.01，**永遠不超過 friedrich**。
- **numeric.js**：**根本沒有 Cholesky**（只能用 LU 對照），大矩陣慢 1.8–3×，且已廢棄 13 年。
- **eigen（WASM）**：小矩陣正確（N=60 解 maxDiff 1.56e-17），但 N=80 的 solve 即 `memory access out of bounds` 硬崩潰殺掉整個 process。

friedrich 的手寫 row-major 純 JS Cholesky，**已經是這批庫裡最快的之一**。

> **「加速」的真實量級在哪裡？** 只有 BLAS/LAPACK 級的原生加速（native addon，或自行重編大-heap WASM）才能在 N=1000 把 207ms 拉下來。調研中所有 npm 可裝候選都不提供這條可用路徑——pure-JS 候選沒有結構性優勢，WASM 候選的 prebuilt 包撐不到 GP 尺寸。

---

## 候選庫對照表

「實測倍率」= 該庫耗時 / friedrich 耗時（median ms）。**>1 代表 friedrich 較快（該庫慢）；<1 代表該庫較快。沒有任何一格 <1。**

| 庫 | 有無 Cholesky | backend | 實測 Cholesky+solve 倍率（vs friedrich） | 安裝難易 | 裁決 |
|---|---|---|---|---|---|
| **ml-matrix** v6.12.2 | ✅ `CholeskyDecomposition`＋`.solve` | 純 JS（每列一條 Float64Array） | 0.49（N=100）→ 1.01（N=1000），**全程 ≤ friedrich** | 容易（純 JS、ESM、零原生依賴） | ❌ 換得了但不加速，全程慢或持平 |
| **numeric.js** v1.2.6 | ⛔ 無（只有 LU，用 `numeric.solve` 對照） | 純 JS（array-of-arrays，無 typed array） | 0.59（N=100）→ 0.34（N=500）→ 0.55（N=1000），**全程更慢** | 容易但 CJS-only、無 ESM | ⛔ 無 Cholesky＋更慢＋廢棄 13 年 |
| **eigen** v0.2.2 | ✅ `Decompositions.cholesky`（Eigen LLT/LDLT） | **WASM**（Eigen C++ via Emscripten） | **N=80 即 WASM heap 溢位崩潰**；solve 上限僅 N≈60 | 容易裝，**但實質不可用** | ⛔ prebuilt heap 撐不到 GP 尺寸 |
| LALOLib | ✅（flat Float64Array，理論最快純 JS 佈局） | 純 JS | 未實測 | **無 npm 套件**（script tag / 模組檔） | ⛔ 無 npm、2019 停維護，不納入 |
| @stdlib/lapack | ⛔ `dpotrf` 尚未實作（RFC 已接受未上線） | typed-array | — | npm 可裝 | ⛔ Cholesky 還沒做出來 |
| TensorFlow.js | ⛔ `tf.linalg.cholesky` 僅 Python 版有 | GPU/native | — | tfjs-node 需 node-gyp | ⛔ tfjs 無此 op |
| vectorious / node-sylvester / @rayyamhk/matrix | ⛔ 皆無 Cholesky | 純 JS / 混合 | — | — | ⛔ 無 Cholesky |
| emlapack | ✅ `dpotrf_`（cwrap 低階指標） | WASM | 未實測 | 極低階 cwrap、6 年未更新 | ⛔ API 太低階、幾無社群使用 |
| gpu.js | ⛔ 無內建（須自寫 kernel） | GPU | — | 已停維護 | ⛔ 須自寫 Cholesky kernel |

**只有 ml-matrix 和 eigen 同時滿足「npm 直裝＋有 Cholesky API」並進入實測**；其餘庫不是無 Cholesky、無 npm、就是未實作或已廢棄。

---

## 分層結論

### 純 JS 庫（ml-matrix / numeric.js）：實測比 friedrich 慢，最好也只能持平

**ml-matrix 計時表**（ms，median；ratio = ml-matrix / friedrich）：

**(a) Cholesky 純分解**（`ml(純分解)` = A 已是 Matrix、不計 `number[][]`→格式轉換）

| N | friedrich | ml-matrix | ratio | ml(純分解，不計轉換) | ratio |
|---|---|---|---|---|---|
| 100 | 0.259 | 0.504 | 0.51 | 0.373 | 0.69 |
| 300 | 5.560 | 8.134 | 0.68 | 5.635 | 0.99 |
| 500 | 24.58 | 29.49 | 0.83 | 26.97 | 0.91 |
| 1000 | 207.3 | 231.8 | 0.89 | 215.8 | 0.96 |

**(b) 分解 + 解 A·x=b**（含轉換）

| N | friedrich | ml-matrix | ratio | numeric(LU) | ratio |
|---|---|---|---|---|---|
| 100 | 0.266 | 0.543 | 0.49 | 0.450 | 0.59 |
| 300 | 6.03 | 8.10 | 0.74 | 9.86 | 0.61 |
| 500 | 26.78 | 30.49 | 0.88 | 78.72 | 0.34 |
| 1000 | 226.9 | 224.6 | 1.01 | 413.1 | 0.55 |

**為何純 JS 庫贏不了 friedrich：**

ml-matrix 與 friedrich **同屬 pure-JS、同為 O(n³)、同樣無 BLAS / SIMD / 多執行緒**——兩者站在同一條起跑線上，差距只能來自實作細節與物件開銷，而非演算法或後端的結構性優勢。具體三點：

1. **儲存佈局差一階**：ml-matrix 是「每列一條 Float64Array」（array-of-Float64Arrays，列間需 pointer-chasing）；friedrich 的手寫三重迴圈 + 行快取對 V8 JIT 非常友善。flat / row-cached 佈局的 cache locality 略勝 per-row typed array，這是純分解端 ml-matrix 始終差 friedrich 一截（ratio 0.69–0.99）的主因。

2. **Matrix 物件包裝開銷**：ml-matrix 的 `CholeskyDecomposition` / `.solve` 走 Matrix 類別封裝（建構子、方法分派、`Matrix` 包裝/解包），小矩陣（N=100）這層 per-call 開銷被放大到 ratio 0.49–0.51（慢一倍）；大矩陣才被 O(n³) 攤薄到接近持平。

3. **`number[][]` 轉換稅**：呼叫端是 `number[][]`，每次進出都要 O(n²) 包裝成 Matrix。對照「ml(純分解)」欄可見：N=300 扣掉轉換後 ratio 從 0.68 回到 0.99，**轉換成本實打實存在**；但即使完全免費，最好也只是追平、永不超越。

**numeric.js** 更不堪：無 Cholesky（只能拿通用 LU 對照，本就該慢約 2×）、內部用 plain nested JS Array（無 typed array，JIT de-opt 風險）、已廢棄 13 年。N=500 慢約 3×、N=1000 慢約 1.8×，且功能上根本缺 Cholesky。

> **誠實但書**：numeric 用 O(2N³/3) 的 LU、friedrich 用對稱正定專用 O(N³/3) 的 Cholesky，倍率中本就有一份「選對演算法」的功勞。但 ml-matrix 用的也是 Cholesky、演算法對齊，仍然輸——證明差距確實落在實作與物件開銷，而非演算法選擇。

### WASM 庫（eigen / emlapack / @stdlib）：理論唯一加速者，實測工程不可用

**eigen 是唯一 npm 直裝、有 Cholesky API、有真 WASM 後端的候選**，安裝零問題（prebuilt WASM 隨包附帶，Node v14+ 免編譯），小矩陣數值正確（N=60 解 maxDiff 1.56e-17）。**但 prebuilt WASM 的固定 heap 在密集 Cholesky 下溢位：**

- 純分解上限 N≈200（N=300 即 `memory access out of bounds`）。
- **分解＋解上限僅 N≈60**（N=80 即崩潰）——因為 eigen **沒有暴露三角 solve**，唯一解線性系統的路徑是 `L.inverse()`（全反矩陣）再 matMul，這條鏈更吃記憶體。
- 崩潰是硬性 WASM `RuntimeError`，會**殺掉整個 Node process**，故主計時迴圈直接排除它。

連最低目標 N=100 的 solve 都跑不起來，談「加速幾倍」沒有意義。

**要讓 WASM 真正可用，必須付出的代價（即便扣不掉的成本先不算）：**

- **自行重編大-heap WASM**：放大 `INITIAL_MEMORY` / 開 `ALLOW_MEMORY_GROWTH` 重新 Emscripten 編譯——這已**超出「npm 直裝即用」範圍**，等同自己維護一份 WASM build。
- **JS↔WASM 邊界 + `number[][]` 轉換稅**：每次進出 WASM 要把 `number[][]` 攤平寫進 WASM linear memory、算完再讀回，且需手動 `.delete()` / `GC.flush()` 管理記憶體。小矩陣（GP 常見 N≤數百）這層 bridge 開銷可能吃掉甚至超過加速收益——這正是 mathjs 維護者評估 WASM 後放棄的原因。
- **增量 Cholesky（`insertColumn`）無法保留**：見下節。eigen / emlapack 只提供 batch 全分解，friedrich 的 O(n²) 增量更新換過去得自己在 JS 側重接，反而把熱路徑拉回純 JS。
- **bundle / 相依成本**：WASM 二進位 + glue code 進 bundle；eigen 上次發布約 3 年前（v0.2.2）實質不再維護、emlapack 6 年未更新且 API 為極低階 cwrap 指標操作，長期維護風險高。

至於 emlapack（WASM LAPACK，理論有 `dpotrf`）API 太低階且幾無社群使用；@stdlib/lapack 的 `dpotrf` 截至 2026 年 6 月**根本還沒實作**——兩者都不構成可用選項。

---

## 遷移取捨：friedrich 兩個 load-bearing 特性對方庫的支援

換庫不只是換 API，friedrich 的 Cholesky 層綁了兩個 GP 專用特性，**任一個丟失都會破壞 train/fit 的正確性或效能**：

### 1. `cholesky_epsilon` substitute（非正定退化的容錯）

friedrich 的 `cholesky(A, epsilon)`（`algebra.mjs:273-292`）精確復刻 nalgebra `Cholesky::new_with_substitute`：當對角 pivot dⱼ ≤ 0 時，**用 epsilon 取代該 pivot 繼續分解**而非直接 panic（`epsilon === null` 才 throw）。這是 GP 在共變異數矩陣因數值誤差落到半正定邊緣時不崩潰的關鍵；`lstsqSolve` 的 fallback（`algebra.mjs:486-492`）也靠它（`cholesky(reg, 1e-300)`）。

- **ml-matrix**：`CholeskyDecomposition` 對非正定矩陣**直接 throw**，`isPositiveDefinite()` 回 false 但**無 substitute 機制**。要復刻容錯得在 JS 側自己攔截、加 jitter 重試——等於把 friedrich 已寫好的邏輯重寫一遍。
- **eigen**：LLT 對非正定也是失敗；LDLT 能處理半正定但語意與 nalgebra substitute 不同，行為對齊需重新驗證。

### 2. `insertColumn` 增量 O(n²) 更新（addSamples 熱路徑）

friedrich 的 `CholeskyDecomposition.insertColumn`（`algebra.mjs:672-707`）支援**末端插入一列、以 O(n²) 增量擴張**既有 Cholesky 因子（`addRowsCholeskyCovMatrix`，`algebra.mjs:789-805` 用於 `GaussianProcess.addSamples`），而非每次加點都 O(n³) 重新全分解。同樣帶 epsilon substitute（`algebra.mjs:697-704`）。

- **ml-matrix / numeric.js / eigen / emlapack**：**全部只提供 batch 全分解，無一支援增量 rank-1 update / column insertion**。換任何一庫，`addSamples` 都會從 O(n²) 退化為 O(n³) 全重算——對「逐點加樣本」的 GP 場景是嚴重退化。要保留就得在 JS 側自己接增量公式，等於 friedrich 這段邏輯原封不動留著，只有 batch 路徑換庫，收益更小、複雜度更高。

**小結**：這兩個特性是 friedrich 為 GP 量身手寫的，**任何候選庫都不原生支援**。換庫不是「替換一個函式」，而是「換掉 batch 分解，但 epsilon 容錯與增量更新仍得自己維護」——遷移面積大、收益（如上）卻是負的或零。

---

## 最終建議（一句話）

**維持現狀。** friedrich-js 手寫的 row-major 純 JS Cholesky 已是這批 npm 可裝庫裡最快的之一：換 ml-matrix 只會慢或持平並另付 Matrix 包裝＋`number[][]` 轉換稅，換 numeric.js 連 Cholesky 都沒有，上 eigen(WASM) 的 prebuilt heap 連 N=100 的 solve 都撐不住、且會丟失 `cholesky_epsilon` 容錯與 `insertColumn` 增量更新這兩個 GP 命脈特性——真要在大矩陣（N≥1000）追求數量級加速，唯一實路是自行接 BLAS/LAPACK 級原生加速（native addon 或自編大-heap WASM 的 `dpotrf`/`dpotrs`），那已遠超「換個 npm 庫」的範疇，需獨立評估。

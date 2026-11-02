# 現況(state)

本檔只記當前已開發功能之最新狀態(各功能做到哪裡、對應之規則帳本條目與測試檔、已知缺口與待辦、最近一次驗證之版本),不寫過程(過程見 `sgud/exp/experience.md`).規則之內容見 `sgud/rule/rulebook.md`.

## 一、功能與對應

| 功能 | 狀態 | 規則帳本 | 測試檔 |
|---|---|---|---|
| 主入口 `src/WGis.mjs`(63 個公開模組)可載入;索引由 `toolg/gPackageIndex.mjs` 產生 | 完成 | R-ENTRY-1 | `test/unit-entrySrc.test.mjs`(含副本執行 gPackageIndex) |
| 公開模組不靜態引用 Node 內建 | 完成 | R-ENTRY-4 | `test/unit-entrySrc.test.mjs` 案 3 |
| 建置產物 `dist/w-gis.umd.js`、`dist/interp2.wk.umd.js` 之外部清單、匯出與行為 | 完成 | R-ENTRY-2、R-ENTRY-3 | `test/unit-entryDist.test.mjs`(副本並指定 cwd 執行 `toolg/gDistRollup.mjs`) |
| 瀏覽器端取得 turf(注入、宿主還原、失敗降級、worker 全域) | 完成;已知限制見帳本 | R-D9-a/b/c | `test/unit-importTurf.test.mjs`、`test/unit-entryDist.test.mjs` 案 6～10 |
| `writeTiff`(Node 專用,float32 單波段,地理參照) | 完成 | R-WT | `test/unit-writeTiff.test.mjs` |
| 其餘等值線、內插、多邊形運算等函數 | 既有 | — | `test/<函數名>.test.mjs` |

## 二、發布與建置(`toolg/`)

- 依 dspec〈自有套件之發布與建置腳本〉(`C:\opensrcOper\dspec\`)之標準寫法,A 型一般套件.現有檔案:`addVersion`、`modifyReadme`、`gPackageIndex`、`cleanFolder`、`gDocsExams`、`convertTurfCode`、`gDistRollup`(`'./src'`、`'./dist'`,`rollupFiles` 後接獨立給外部使用之 `rollupWorker` 產出 `dist/interp2.wk.umd.js`).發布列序見 `script.txt`(使用者維護).
- 2026-11-02 已移除 `distConfig.mjs`、`checkDist.mjs`、`getIndexNames.mjs`(原為修正輪自創之共用設定與檢查層);產物之檢查改在測試.本套件不另立 toolg 寫法之規則.

## 三、已知缺口與待辦

- `toolg/gDocsExams.mjs`(主控未提交之批次改動)改呼叫 `w-package-tools/src/genDocsExams.mjs`;本機已安裝之 w-package-tools 1.1.21 無此檔,執行得 `ERR_MODULE_NOT_FOUND`.待上游新版安裝後方可執行(非本套件問題).
- 已知限制 L1～L4、D10 見帳本第二節,未修.

## 四、最近一次驗證

- 2026-11-02(任務 20261102075126 gis267):`npm test` 全套綠(案數見該任務報告);以套件根依 `script.txt` 序實跑 cleanFolder→jsdoc→gDocsExams→convertTurfCode→gDistRollup:`dist/w-gis.umd.js` 與 `.map` 與改前位元組相同,63 個匯出同名同型,`dist/interp2.wk.umd.js` 僅隨機暫存識別字不同;gDocsExams 因上列缺口未能執行.
- `package.json` 版本:1.1.11(本輪未改).

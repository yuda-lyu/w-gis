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
| `interp1` 交給 wsemi 之數據點與內插點先清理為有效數字(`isenum`＋`Number()`),內插點以純數字陣列交付;無效值由本套件略過或回 `{ err }`,處置寫於 JSDoc;有效輸入結果與修前逐字相同;已以「第 3 輪嚴格版」wsemi 替身前瞻驗證 | 完成(2026-11-02 r3gis);wsemi 依賴 `^1.9.44` | R-I1 | `test/interp1.test.mjs`、`test/unit-interp1WsemiStrict.test.mjs` |
| 其餘等值線、內插、多邊形運算等函數 | 既有 | — | `test/<函數名>.test.mjs` |

## 二、發布與建置(`toolg/`)

- 依 dspec〈自有套件之發布與建置腳本〉(`C:\opensrcOper\dspec\`)之標準寫法,A 型一般套件.現有檔案:`addVersion`、`modifyReadme`、`gPackageIndex`、`cleanFolder`、`gDocsExams`、`convertTurfCode`、`gDistRollup`(`'./src'`、`'./dist'`,`rollupFiles` 後接獨立給外部使用之 `rollupWorker` 產出 `dist/interp2.wk.umd.js`).發布列序見 `script.txt`(使用者維護).
- 2026-11-02 已移除 `distConfig.mjs`、`checkDist.mjs`、`getIndexNames.mjs`(原為修正輪自創之共用設定與檢查層);產物之檢查改在測試.本套件不另立 toolg 寫法之規則.

## 三、已知缺口與待辦

- `toolg/gDocsExams.mjs`(主控未提交之批次改動)改呼叫 `w-package-tools/src/genDocsExams.mjs`;本機已安裝之 w-package-tools 1.1.21 無此檔,執行得 `ERR_MODULE_NOT_FOUND`.待上游新版安裝後方可執行(非本套件問題).
- 已知限制 L1～L4、L5、D10 見帳本第二節,未修.L5:`interp1` 之 `opt.xMin`／`opt.xMax` 原樣交給 wsemi(`Infinity` 使 stairs 該側無界);wsemi 後續輪次若改收緊須重評.
- `arrGroupByMaxmin`、`arrLookupByMaxmin`、`strTruncate`:本套件 `src/` 內 0 站點(2026-11-02 盤點,指令見 R-I1),本輪無須處理.
- `src/ptsXtoArr.mjs`、`src/ptsXYtoArr.mjs` 仍以 `isnum`＋`toNumber` 判定(公開模組,供 `calcDelaunay`、`calcVoronoi`、`interp2NaturalNeighbor`、`interp2Kriging` 使用),不屬本輪範圍;`interp1` 已不再使用.

## 四、最近一次驗證

- 2026-11-02(任務 20261102075126 gis267):`npm test` 全套綠(案數見該任務報告);以套件根依 `script.txt` 序實跑 cleanFolder→jsdoc→gDocsExams→convertTurfCode→gDistRollup:`dist/w-gis.umd.js` 與 `.map` 與改前位元組相同,63 個匯出同名同型,`dist/interp2.wk.umd.js` 僅隨機暫存識別字不同;gDocsExams 因上列缺口未能執行.
- 2026-11-02(任務 20261102171617 r3gis):`npm test` 全套 439 passing、0 failing(含新增 20 案);`interp1` 修前修後 109 案差分:有效輸入 77 案 0 差異,含無效值 32 案中 24 案依 R-I1 改變、8 案(非數字之無效內插點)不變;嚴格版替身下修後碼 0 差異、交給 wsemi 之值 0 違規.
- `package.json` 版本:1.1.13(本輪未改;`wsemi` 依賴由 `^1.9.42` 升至 `^1.9.44`,`package-lock.json` 同步).

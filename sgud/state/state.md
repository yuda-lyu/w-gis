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
| `interp2NaturalNeighbor` 可內插範圍與 `opt.limitInsideHull`(布林,預設 `true`:凸包外回 null 且不呼叫回呼;`false` 時凸包外投影至最近凸包邊之兩端點線性;凸包邊上與容許值內一律兩端點線性;正方形不再限制);凸包判定為自建 `src/_makeHullTester.mjs` 與三角網之精確走訪 | 完成(1.1.27 發布 limitInsideHull;2026-11-14 gis145 改投影,未發布) | R-NN1 | `test/unit-interp2NaturalNeighborHull.test.mjs`、`test/unit-makeHullTester.test.mjs` |
| `interp2NaturalNeighbor` 凸包內之 Sibson 精確權重(Liang & Hale;delaunator＋robust-predicates;內部座標不捨入;偵測＋BigInt 備援;`opt.funInterpError`;回呼 `method`、`ps` 只列權重 >0) | 完成(2026-11-14 gis145,未提交未發布);破壞性變更見帳本第三節 | R-NN2(L6 已修) | `test/unit-interp2NaturalNeighborSibson.test.mjs`(判準 `test/tools/sibsonExactRef.mjs`)、`test/interp2NaturalNeighbor.test.mjs` |
| `interp2NaturalNeighbor` 之 `funInterpFragments` 回呼收到之 `msg.funInv`(將正規化 z 還原為原始 z 之尺度,僅供讀取;回傳值仍須為正規化值):原內部呼叫 `inv(vv, 2)` 拋 TypeError(`st` 改以字母為鍵時漏改),已改 `inv(vv, 'z')` | 完成(2026-11-13 gis-l7,未發布);L7 已修 | L7 | `test/unit-interp2NaturalNeighborFunInv.test.mjs` |
| 其餘等值線、內插、多邊形運算等函數 | 既有 | — | `test/<函數名>.test.mjs` |

## 二、發布與建置(`toolg/`)

- 依 dspec〈自有套件之發布與建置腳本〉(`C:\opensrcOper\dspec\`)之標準寫法,A 型一般套件.現有檔案:`addVersion`、`modifyReadme`、`gPackageIndex`、`cleanFolder`、`gDocsExams`、`convertTurfCode`、`gDistRollup`(`'./src'`、`'./dist'`,`rollupFiles` 後接獨立給外部使用之 `rollupWorker` 產出 `dist/interp2.wk.umd.js`).發布列序見 `script.txt`(使用者維護).
- 2026-11-02 已移除 `distConfig.mjs`、`checkDist.mjs`、`getIndexNames.mjs`(原為修正輪自創之共用設定與檢查層);產物之檢查改在測試.本套件不另立 toolg 寫法之規則.

## 三、已知缺口與待辦

- `toolg/gDocsExams.mjs`(主控未提交之批次改動)改呼叫 `w-package-tools/src/genDocsExams.mjs`;本機已安裝之 w-package-tools 1.1.21 無此檔,執行得 `ERR_MODULE_NOT_FOUND`.待上游新版安裝後方可執行(非本套件問題).
- 已知限制 L1～L4、L5、D10 見帳本第二節,未修;L6(正方形裁切)、L7 已修(見上表與帳本).L5:`interp1` 之 `opt.xMin`／`opt.xMax` 原樣交給 wsemi(`Infinity` 使 stairs 該側無界);wsemi 後續輪次若改收緊須重評.
- `interp2NaturalNeighbor` 之「空腔結構不符」與「精確備援亦不過」兩條路徑無法以公開介面構造(壓力 116,186 點 0 次),只由程式審查與變異覆蓋其上游;下游 w-maplibregl-vue、w-leaflet-vue 之 `AppCTRContourSetInterp2.vue` 示範頁(經 `dist/interp2.wk.umd.js`,`method: 'naturalNeighbor'`)之等值線會隨凸包內之值改變(無 e2e 案例涵蓋).
- `arrGroupByMaxmin`、`arrLookupByMaxmin`、`strTruncate`:本套件 `src/` 內 0 站點(2026-11-02 盤點,指令見 R-I1),本輪無須處理.
- `src/ptsXtoArr.mjs`、`src/ptsXYtoArr.mjs` 仍以 `isnum`＋`toNumber` 判定(公開模組,供 `calcDelaunay`、`calcVoronoi`、`interp2NaturalNeighbor`、`interp2Kriging` 使用),不屬本輪範圍;`interp1` 已不再使用.

## 四、最近一次驗證

- 2026-11-02(任務 20261102075126 gis267):`npm test` 全套綠(案數見該任務報告);以套件根依 `script.txt` 序實跑 cleanFolder→jsdoc→gDocsExams→convertTurfCode→gDistRollup:`dist/w-gis.umd.js` 與 `.map` 與改前位元組相同,63 個匯出同名同型,`dist/interp2.wk.umd.js` 僅隨機暫存識別字不同;gDocsExams 因上列缺口未能執行.
- 2026-11-02(任務 20261102171617 r3gis):`npm test` 全套 439 passing、0 failing(含新增 20 案);`interp1` 修前修後 109 案差分:有效輸入 77 案 0 差異,含無效值 32 案中 24 案依 R-I1 改變、8 案(非數字之無效內插點)不變;嚴格版替身下修後碼 0 差異、交給 wsemi 之值 0 違規.
- 2026-11-13(任務 20261113225446 gis-hull,未提交未發布):`npm test` 全套 504 passing、0 failing(新增 `unit-interp2NaturalNeighborHull` 52 案、`unit-makeHullTester` 13 案;`unit-entryDist` 案 3、案 5 增對重建產物之 `limitInsideHull` 斷言);新測試對修前碼 30 案紅(其餘 22 案為凸包內與 `false` 之修前值,確為修前實測值);11 個變異皆被殺;外審 terra(max)一位提 12 條,皆屬實或部分屬實、0 誤報,已改程式、文件與測試(R-NN1-d2、d3).
- 2026-11-13(任務 20261113225446 gis-l7,未提交未發布):`npm test` 全套 512 passing、0 failing(較 gis-hull 輪之 504 增 `unit-interp2NaturalNeighborFunInv` 8 案);修 L7(`msg.funInv`);新測試對修前碼與錯軸變異各 7 案紅.
- 2026-11-14(任務 20261114170613 gis145,未提交未發布):新增相依 `delaunator@^5.1.0`、`robust-predicates@^3.0.3`(冷卻期與供應鏈檢查見該任務報告);先以 `toolg/gDistRollup.mjs` 建 dist,`npm test` 全套 568 passing、0 failing、0 pending(較 gis-l7 之 512 增草案 24 案與 `unit-interp2NaturalNeighborSibson` 32 案);變異 18 個 17 個被殺(存活者為與局部座標檢查等價之負面積檢查);外審 terra、Argon、agy-opus 皆額度用盡(以其探測腳本重建並核實 13 條),agy-hydrogen 完成 11 條,處置見任務報告.
- `package.json` 版本:1.1.27(已發布;本輪未改版號).

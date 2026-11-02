# 規則帳本

本檔為套件設計與開發階段之規則帳本,為要求程式碼須長成什麼樣,或由規格產出之測試(項目/說明/流程)有哪些,包含軸、單一擁有者、已知限制、破壞性變更紀錄,以及對應是哪些測試檔案或指令等,由agent自行編列、擴充與維護.

> 建立:2026-10-14(任務 20261014042247 run02,依主控複審 `C:\opensrcOper\dnow\20261014042247\review\run01-複審.md` 之裁示).來源審計:`C:\opensrcOper\dnow\20261014042247\agent-out\run01-審計回應.md`.
> 本帳本之規則先於程式寫定,測試由規則衍生;規則之「站點全集」須以盤點指令重跑得出,不得憑記憶增刪.
> 2026-11-02:`toolg/` 之發布與建置腳本依 dspec〈自有套件之發布與建置腳本〉(`C:\opensrcOper\dspec\`);R-ENTRY-1/2/3 中據 `distConfig`／`checkDist`／`getIndexNames` 所立之條款已撤,改為「建置寫法依 dspec;產物之檢查在測試」.本帳本不另立 toolg 寫法之規則.

## 一、規則

### R-ENTRY-1 對外入口可載入(src 索引與逐檔)

- **規則**:`src/WGis.mjs` 可 import,其匯出名單等於「`src/` 頂層 `.mjs`,扣除 `WGis.mjs` 與 `_` 開頭者」;名單內每個 `src/<名>.mjs` 可單獨 import,其 default 與索引之同名匯出為同一參考;型別皆為函數,唯 `importTurf` 為物件(Node 下為 `@turf/turf` 之命名空間).
- **產生與核對**:索引 `src/WGis.mjs` 由 `toolg/gPackageIndex.mjs` 產生(發布列 `script.txt:4`,寫法依 dspec〈自有套件之發布與建置腳本〉);測試以 `test/tools/getIndexNames.mjs`(測試用之獨立判準)核對索引與產物之名單,並以副本並指定 cwd 執行 `toolg/gPackageIndex.mjs`,核對產生結果等於已提交之索引.
- **盤點指令**:`node -e "import('./test/tools/getIndexNames.mjs').then((m)=>console.log(m.default('./src').join(',')))"`;`npx mocha test/unit-entrySrc.test.mjs --timeout 180000`.
- **站點全集**:63 個公開模組(2026-10-14 移除 interp3 後;移除前 64).索引由 gPackageIndex 以 `\r\n` 接合並補結尾換行(eslint `eol-last`).
- **測試**:`test/unit-entrySrc.test.mjs` 案 1(索引可載入且名單相符、型別)、案 2(逐檔可載入且與索引同參考)、案 4(副本執行 gPackageIndex,產生之索引等於已提交者且名單等於獨立判準).

### R-ENTRY-2 建置無未解析引用,產物之外部清單等於宣告

- **規則**:以 `toolg/gDistRollup.mjs`(選項寫於本檔)由目前 src 建置時,rollup 訊息不得含 `could not be resolved`(UNRESOLVED_IMPORT)與 `No name was provided for external module`(MISSING_GLOBAL_NAME);主產物 UMD 檔頭 CJS 分支之 `require(...)` 清單等於 `gDistRollup.mjs` 宣告之 `external`(現為 `['@turf/turf']`);worker 產物之清單等於 `['worker_threads']`(rollupWorker 自身注入).只斷言上述特定訊息,不斷言警告總數(Browserslist 過期、d3-interpolate 循環依賴等噪音會隨環境變動).
- **建置寫法**:依 dspec〈自有套件之發布與建置腳本〉(`'./src'`、`'./dist'`,`rollupFiles` 後接獨立給外部使用之 `rollupWorker` 產出 `dist/interp2.wk.umd.js`,選項寫於 `toolg/gDistRollup.mjs`,發布列 `script.txt:12`).產物之檢查在測試,不在 toolg.
- **站點全集**:`dist/w-gis.umd.js`、`dist/interp2.wk.umd.js`.
- **測試**:`test/unit-entryDist.test.mjs` 案 1(訊息)、案 2(主產物外部清單)、案 5(worker 外部清單與呼叫)、案 11(dist 檔名恰為三檔,`interp2.wk.umd.js` 為下游頁面直接引用).
- **發布流程無額外檢查層**:依 dspec〈自有套件之發布與建置腳本〉規則 1、4,`gDistRollup.mjs` 不另包檢查;產物之核對(建置訊息、主產物與 worker 產物之匯出名與 external)只在上列測試.

### R-ENTRY-3 產物可載入且行為與 src 相同

- **規則**:重建之主產物以 CJS 載入,匯出名單同 R-ENTRY-1;抽測函數(`convertCoordinate`、`getCentroidMultiPolygon`、`interp2` 同步模式)之結果與直接呼叫 src 者深等;UMD 全域分支(無 module/exports/define 之 vm context)可載入且鍵名同名單;重建之 worker 產物呼叫結果與 src `interp2` 深等.
- **測試**:`test/unit-entryDist.test.mjs` 案 3、案 4、案 5.建置以副本並指定 cwd:把 `src`、`toolg`、`package.json` 複製到 `test/_tmp/unit-entryDist/`,以 `spawn`(`test/tools/runNode.mjs`)指定該 cwd 執行 `toolg/gDistRollup.mjs`(`package.json` 副本供 banner 讀版號;rollupWorker 之 `temp-*.js` 亦落於此),`after` 刪除該資料夾.不得以 repo 根為 cwd 建置(行程被中止時暫存檔會留在 repo 根,而發布流程 `git add .  -A` 會帶入).

### R-ENTRY-4 公開模組不靜態引用 Node 內建

- **規則**:`src/` 頂層公開模組之靜態引用不得有 `module.isBuiltin(spec)` 為真者,以保證 bundler(webpack 5 web 不再自動 polyfill)可打包主入口與索引.Node 專用能力於執行期以 `process.getBuiltinModule` 取得.
- **盤點指令**:`git grep -n -E "from '(node:)?(fs|path|os|child_process|crypto|stream|url|util|worker_threads|events|http|https)'" -- src`(只應命中 `src/kriging-friedrich/verify_golden.mjs`).
- **站點全集**:已套 `src/writeTiff.mjs`(2026-10-14 改用 `process.getBuiltinModule('fs')`);刻意不套 `src/kriging-friedrich/verify_golden.mjs`(開發腳本,非公開模組,import 即執行).
- **測試**:`test/unit-entrySrc.test.mjs` 案 3.

### R-WT writeTiff 為 Node 專用,執行期取得 fs

- **規則**:不靜態引用 `fs`;呼叫時以 `process.getBuiltinModule('fs')` 取得;取不到(非 Node,或 Node 早於 v20.16 之 20.x、21.x、22.0~22.2)即拋錯,訊息為 `writeTiff requires Node.js with process.getBuiltinModule (v20.16+ for 20.x, or v22.3+)`;Node 下寫出之檔案為合法 TIFF.
- **輸出格式(2026-10-14 run03,D11 之修正)**:單波段、不壓縮之 IEEE float32;宣告 `BitsPerSample:[32]`、`SampleFormat:[3]`,與資料 `Float32Array` 一致(geotiff 依值之型別寫入,宣告不得與資料不符);`PhotometricInterpretation:1`;`SamplesPerPixel` 由 geotiff 依波段數給 `[1]`;不壓縮故不需 `Predictor`;無 NoData 參數故不寫 `GDAL_NODATA`(`null` 寫為 0,`undefined`、`NaN` 寫為 NaN).讀回之像素值等於輸入之 float32 值(`Math.fround`).
- **地理參照(2026-10-14 run04,D12 之修正)**:
  - 網格語意同 interp2Grid:格點 `x = xmin + ix·dx`、`y = ymin + iy·dy`(`src/interp2Grid.mjs:203-247`),值為格點上之點估計;grds 第 0 列為最上格點列 `y = ymin + (ynum − 1)·dy`(interp2Grid 須 `inverseKeyY: true`,interp2Raster 固定如此).xmax、ymax 只是範圍上限,不影響輸出.
  - 寫 `GTRasterTypeGeoKey: 1`(PixelIsArea);`ModelTiepoint` 為左上像素之左上角 `(xmin − dx/2, ymin + (ynum − 0.5)·dy)`;`ModelPixelScale: [dx, dy, 0]`;**像素中心即格點**.
  - 不採 PixelIsPoint:GDAL 對兩種編碼解得相同之 geotransform,但 geotiff.js 之 `getOrigin`/`getBoundingBox`、OpenLayers `ol/source/GeoTIFF.js`、georaster 皆以 tiepoint 為左上角而不依 RasterType 平移,PixelIsPoint 在其上差半格(`./tmp/run04/rastertype-variants.log` 實測).
  - `opt.typeModel`:`'geographic'`(預設)寫 `GTModelTypeGeoKey: 2` 與 `GeographicTypeGeoKey`;`'projected'` 寫 `GTModelTypeGeoKey: 1` 與 `ProjectedCSTypeGeoKey`;值皆為 `opt.typeGeoKey`;其他值 reject,訊息 `opt.typeModel[<值>] must be 'geographic' or 'projected'`.
  - `opt.typeGeoKey`:有效值為 1 至 65535 之整數(geotiff 以 SHORT 寫入 GeoKey,`node_modules/geotiff/dist-module/globals.js:305-315`;改前實測 102100 被截為 36564、65536 被截為 0).地理型別未給或無效則用 4326(既有規則);投影型別未給或無效則 reject,訊息 `opt.typeGeoKey[<值>] must be an integer CRS code from 1 to 65535 when opt.typeModel is 'projected'`.
  - 原點運算所用之參數:xmin、ymin 須為數字(含數字字串,以 `isnum`/`cdbl` 轉型,同 interp2Grid);dx、dy 須為大於 0 之數字;xnum、ynum 須為正整數(`ispint`/`cint`);不符即 reject,訊息格式同 interp2Grid(如 `xmin[abc] is not an effective number`).
  - 所有 reject 皆發生於寫檔之前,不留檔.
  - **盤點指令**:`rg -n "GTModelTypeGeoKey|GTRasterTypeGeoKey|ModelTiepoint|ProjectedCSTypeGeoKey|GeographicTypeGeoKey|writeArrayBuffer" src`.**站點全集**:已套 `src/writeTiff.mjs`(本套件唯一寫出 GeoTIFF 之處).
- **測試**:`test/unit-writeTiff.test.mjs`(12 案:尺寸解析度與原點、地理型別 GeoKey、投影型別 GeoKey、無效 typeModel、投影缺有效代碼、像素中心＝interp2Grid 格點(範圍不整除)、原點參數之數字字串轉型、原點參數無效、無 getBuiltinModule、float32 單波段標籤、像素值、小數負數與大於 255 之值).輸入空間表 30 格以 src 與 dist、geotiff.js 與 GDAL 讀回之驗收,紀錄暫存於 `./tmp/run04/`(主控複審後可清);以 GDAL 讀回之作法(gdal3.js 裝於 tmp,非專案依賴)見 `sgud/exp/experience.md` run04 節.

### R-D9 瀏覽器端取得 turf 之方式

- **R-D9-a**:瀏覽器主執行緒注入內嵌之 turf 後,若宿主頁原已有 `window.turf`,須還原為原物件;本套件自留注入之 turf 參考,不沿用宿主之 turf(宿主可能為 v6,API 與 v7 不同).宿主原無 `window.turf` 時維持既有行為(注入之 turf 留在全域).
- **R-D9-b**:UMD 外部模組 `@turf/turf` 之全域名為 `turf`(turf 官方 UMD 設定之全域;寫於 `toolg/gDistRollup.mjs` 之 `globals`),使非 window 環境(Web Worker 先 `importScripts` turf.min.js)可取得 turf.已採:2026-10-14 真 Chromium 實測 Web Worker 先 `importScripts` turf.min.js 再載入主產物,`importTurf` 有 184 鍵、`getCentroidMultiPolygon` 得 `[1,1]`;改前同情境失敗.
- **R-D9-c**:注入失敗(Trusted Types 拋錯)、注入未執行(CSP 禁 inline、AMD 頁)時不得使整包載入失敗;`importTurf` 為 null,並以 `console.warn` 說明原因.
- **單一擁有者**:注入邏輯只寫在 `src/_importTurfBrowser.mjs` 之 `injectTurf(g, code)`(依賴注入之純函式,模組載入時以 `getGlobal()` 與內嵌碼呼叫一次).
- **測試**:`test/unit-importTurf.test.mjs`(injectTurf 之 a、c 與 Node 下 importTurf);`test/unit-entryDist.test.mjs` 於產物上以 vm 模擬:案 6(D9-b,worker 全域預載 turf)、案 7(一般頁注入後 turf 留在全域)、案 8(D9-a,宿主 turf 還原)、案 9(D9-c,innerHTML 拋錯仍可載入)、案 10(D9-c,注入未執行仍可載入).vm 之沙箱物件為 `[object Object]`,與瀏覽器之 Window 不同,故真實環境以 `./tmp/run02/acc-env.mjs` 之 Chromium 驗收補足.
- **已知限制(未修)**:AMD 頁注入之 turf 走 AMD 分支,turf 不可用(只得 warn);CSP 禁 inline 時 turf 不可用(只得 warn);worker 須先 `importScripts` turf;注入改為延遲並優先使用已打包之 turf(Q7(d))另案.

## 二、已知限制(文件化)

| ID | 內容 | 落點 |
|---|---|---|
| L1 | `dist/interp2.wk.umd.js` 無法由 bundler(web)打包(rollupWorker `runin:'both'` 必然外部引用 `worker_threads`),供 `<script>` 與 Node 使用 | `src/interp2.mjs` JSDoc |
| L2 | UMD 之 AMD 分支依賴 `@turf/turf`,AMD 使用者須自行提供 | 本帳本 |
| L3 | worker 產物以 blob URL 建立 Web Worker,頁面 CSP 須允許 `blob:`,否則呼叫 reject(值為 Event) | `src/interp2.mjs` JSDoc |
| L4 | 頁面已有 AMD 載入器時,以 `<script>` 載入主產物得不到 `window['w-gis']`(UMD 慣例) | 本帳本 |
| D10 | 無 ESM 入口:Node ESM 須以 default 匯入主入口(`import gis from 'w-gis'`),具名匯入不可用 | `README.md` |
| D11(已修,2026-10-14 run03) | 原 `writeTiff` 以 `Float32Array` 寫入卻宣告 `BitsPerSample:[8]`、`SampleFormat:[1]`,geotiff 依值之型別寫入(`node_modules/geotiff/dist-module/geotiffwriter.js:316-317`),讀回值錯(輸入 1、2 讀回 63、128).主控裁示採 float32,已改宣告 32/3,見 R-WT | `src/writeTiff.mjs`;`test/unit-writeTiff.test.mjs` |
| D12(已修,2026-10-14 run04,主控裁示採 (a)) | 原 `writeTiff` 只寫 `GeographicTypeGeoKey`(值為 `opt.typeGeoKey`),未寫 `GTModelTypeGeoKey` 與 `GTRasterTypeGeoKey`;geotiff 寫入端只在未給任何 CRS 鍵時才補(`geotiffwriter.js:476-483`).OGC GeoTIFF 1.1(19-008r4)Req 8.1 規定 SHALL 含 GTModelTypeGeoKey;Req 8.7/8.8 規定投影(1)須有 ProjectedCRSGeoKey、地理(2)須有 GeodeticCRSGeoKey.後果(實測):GDAL(QGIS)將輸出讀為無名稱之 ENGCRS,座標系統遺失;投影代碼(如 3826)被寫進 GeographicTypeGeoKey;另原點以 `(xmin, ymax)` 為格子角,像素中心偏離格點半格.已依 R-WT 之地理參照規則修正 | `src/writeTiff.mjs`;`test/unit-writeTiff.test.mjs` |

## 三、破壞性變更紀錄

| 版本(預期) | 變更 | 理由 |
|---|---|---|
| 1.1.7 | 移除 `interp3`(主入口匯出 64 → 63;刪除 `src/interp3.mjs` 與根目錄 `g_interp3.mjs`) | 其依賴之 `wsemi/src/execPyodide.mjs` 已於 wsemi 1.8.46 刪除;自 1.0.84 起主入口無法載入,interp3 已無法使用 |
| 1.1.7 | `writeTiff` 需 Node.js v20.16 以上之 20.x 或 v22.3 以上 | 改以 `process.getBuiltinModule('fs')` 取得 fs,使主入口不再靜態引用 Node 內建 |
| 1.1.7 | `writeTiff` 輸出改為 float32 單波段(`BitsPerSample:[32]`、`SampleFormat:[3]`) | 原輸出之像素資料與檔頭不符而不可用(D11) |
| 1.1.7 | `writeTiff` 新增 `opt.typeModel`(`'geographic'` 預設、`'projected'`),寫入 `GTModelTypeGeoKey`、`GTRasterTypeGeoKey: 1` 與對應之 CRS 鍵;原點改為左上格點各外推半格(像素中心即格點);無效 typeModel、投影缺代碼、原點參數無效皆 reject | 原輸出缺必備之 GTModelTypeGeoKey,GDAL 讀不出座標系統;投影代碼寫錯鍵;像素中心偏離格點半格(D12) |

## 四、測試與指令對照

| 規則 | 測試檔 | 單獨執行 |
|---|---|---|
| R-ENTRY-1(含副本執行 gPackageIndex)、R-ENTRY-4 | `test/unit-entrySrc.test.mjs` | `npx mocha test/unit-entrySrc.test.mjs --timeout 180000` |
| R-ENTRY-2、R-ENTRY-3、R-D9-a/b/c(產物;副本執行 gDistRollup) | `test/unit-entryDist.test.mjs` | `npx mocha test/unit-entryDist.test.mjs --timeout 180000` |
| R-WT | `test/unit-writeTiff.test.mjs` | `npx mocha test/unit-writeTiff.test.mjs --timeout 180000` |
| R-D9-a/c(邏輯)、importTurf | `test/unit-importTurf.test.mjs` | `npx mocha test/unit-importTurf.test.mjs --timeout 180000` |
| 全部 | — | `npm test` |

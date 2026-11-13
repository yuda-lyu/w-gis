# 累積經驗

本檔為執行工作時特有之累積經驗,留給後續之嘗試、執行與判斷,由agent自行編列、擴充與維護.

## 2026-10-14 審計 run01(任務 20261014042247:主入口可載入性)

### 環境與工具
- 本機有可借用之工具(唯讀使用,不改該 repo):playwright 1.63.0 於 `C:/opensrc/開源-JS-001-2-w-package-tools-e2e/w-package-tools-e2e/node_modules/playwright`(瀏覽器 chromium 1243 已裝於 `%LOCALAPPDATA%/ms-playwright`);webpack 5.109.0 於 `C:/opensrc/開源-JS-405-7-w-leaflet-vue/w-leaflet-vue/node_modules/webpack`。以 `createRequire('<該repo>/package.json')` 取用,路徑一律寫 `C:/...`,勿寫 git-bash 之 `/c/...`(node 會解析成錯的磁碟路徑)。
- 本機 Python 3.14 無 scipy,無法重現 interp3 之歷史數值。
- `npm view w-gis time --json` 之輸出為陣列包一個物件,取 `t[0]`。
- `./tmp/` 內已有 2026-06-15 之他人探測檔(bench-kriging 等),非本次產物,勿刪;本次產物集中於 `./tmp/entry-load*`。
- src、test 之檔案為 CRLF;以字串替換改碼或比對時用 `/\r?\n/`,勿寫死 `\n`(曾因此替換失敗)。`toolg/*.mjs` 為 LF。

### 建置(w-package-tools 1.1.18)之已知行為
- `rollupFiles` 會先清空 `fdTar`;在 `./tmp` 試建時務必確認 fdTar 落在 tmp 內(探測腳本以 `startsWith` 擋)。
- 以與發布相同之選項建置(`toolg/gDistRollup.mjs`):主建置 9～19 s(含 terser),worker 約 3 s。
- `rollupFile` 不接受 `onwarn`;rollup 之警告經預設 onwarn 以 `console.warn(message)` 印出,要收集就包住 `console.warn`。要取得警告之 `code` 欄位,直接以 rollup + `@rollup/plugin-node-resolve({ browser:true, preferBuiltins:false })` 建置並給 `onwarn`(rollupFile 之 runin='browser' 即此設定)。
- 在上述 browser 設定下,任何 Node 內建(如 `fs`)若未列入 `external`,警告碼即為 `UNRESOLVED_IMPORT`(與不存在之模組同碼)。w-package-tools 1.1.19 擬把未列 external 之 UNRESOLVED_IMPORT 改為建置失敗。
- `rollupWorker` 會在 cwd 暫寫 `./temp-<id>-{nw,ww,mg}.js` 並於 finally 刪除;其 both 模式之產物必外部引用 `worker_threads`(每次 2 筆 MISSING_NODE_BUILTINS),因此 `interp2.wk.umd.js` 無法由 webpack(web)打包,只能 `<script>` 或 Node 使用。
- worker 產物在 Node 內以 `new Worker(code,{eval:true})` 執行 CJS 字串:勿用 `node --input-type=module -e` 測 worker(會得 `require is not defined in ES module scope`,w-package-tools 帳本 `sgud/rule/rulebook.md:330` 已列為不支援);改寫成一般 `.mjs` 檔再跑。

### 本套件之事實(審計時點)
- `toolg/gPackageIndex.mjs` 依 `src/` 頂層 `.mjs`(扣 `WGis.mjs` 與 `_` 開頭)產生 `src/WGis.mjs`(`\r\n` 接合);它與 `toolg/gDistRollup.mjs` 都是 import 即執行,測試不可直接 import 它們。
- 發布流程不跑測試:`script.txt` 之 `#npm test` 為註解,w-pksupdate 只解除 `#node toolg/addVersion.mjs` 與 `#npm publish` 之註解;但 node 指令以非 0 結束會使 w-pksupdate 中止(其 `src/runScript.mjs:280`),可在建置腳本內加檢查作閘門。(2026-11-02 依 dspec〈自有套件之發布與建置腳本〉撤,改回標準寫法)
- 下游只有 w-leaflet-vue、w-maplibregl-vue:深層引用 calcContours、getCentroidMultiPolygon、fixCloseMultiPolygon、flattenMultiPolygon、invCoordMultiPolygonOrMultiPolyline、splitAndProcGeoJSON 六檔,並以 CDN `<script>` 載入 `dist/interp2.wk.umd.js`(使用 `window['interp2']`)。改動須保住這些。
- dist 之 UMD 在瀏覽器全域分支取外部模組時只會拿到 undefined 而不丟錯,所以「瀏覽器能載入」不能證明 Node／bundler 能載入;三種環境要分開驗。
- webpack 5(web)不自動 polyfill Node 內建:UMD 之 CJS 分支只要含 `require("fs")` 就打包失敗,即使 rollup 端已把 fs 列為 external 也一樣。
- `package.json` 之 `"browser":{"fs":false}` 會連 w-gis 自身之建置也一起套用(node-resolve browser:true):只加它而不把 fs 列 external,dist 之 fs 會變空模組,Node 端 writeTiff 即壞;兩者要併用。

### 盤點「引用皆可解析」時之教訓(外部複審找出我漏的 8 列軸、10 格不實)
- 引用不只靜態 import:本套件之 turf 是執行期依環境取得(`src/importTurf.mjs:25` 依 isWindow 分流;瀏覽器下 `src/_importTurfBrowser.mjs` 於載入期以 innerHTML 注入 base64 turf;非 window 下取 UMD 外部全域 `'@turf/turf'`,而此全域無人定義)。盤點時要把這類執行期引用列為軸成員。
- 瀏覽器函式庫之環境軸要含頁面執行條件:一般頁面、CSP 禁 inline、Trusted Types、CSP 缺 `blob:`、Web Worker、RequireJS、已有 AMD 載入器、jsdom;另含 Node 版本(require(esm) 之界線 20.19/22.12;`process.getBuiltinModule` 之界線 20.16/22.3)、具名／default 匯入、CDN 自動轉 ESM(jsdelivr `+esm`)。
- 「推論」與「不適用」不能代替實測:AMD、worker 兩格當初以推論帶過,複審一測就壞。
- wsemi 之 `haskey`/`isobj` 只認 `[object Object]`,對 Window、類別實例恆回 false;判斷全域物件之鍵要用 `key in g` 或 `g[key] !== undefined`。

### 執行環境:列印模式(claude -p)之等待
- 本 session 以 `claude.exe -p --output-format json` 執行(主控之 dispatch.mjs 啟動)。依官方文件(code.claude.com/docs/en/headless#background-tasks-at-exit):本輪結束後,-p 會等背景工作再給模型一輪,json 取最後一輪之結果;背景子代理受閒置上限(預設 10 分鐘,`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`)約束,主對話之背景 Bash 不受此上限(但 -p 文字模式之背景 Bash 預設時限 10 分鐘,須明給 timeout)。
- 作法:要等子代理時,掛一個明給 timeout 之背景 sleep 撐住執行,且每一輪之回覆都寫成主控要求之完整最終格式;子代理回來後在同一輪內處理完,再結束。
- 寫檔一律用 Write/Edit 工具;本次曾一度以 shell heredoc 追加檔案,違反全域規範 §12.2。

## 2026-10-14 實作 run02(移除 interp3、writeTiff 改 getBuiltinModule、D9 三項、發布閘門)

### 事故與防再犯
- **曾誤覆寫受追蹤之 `dist/`**:為驗發布閘門建了副本,卻以 repo 根為 cwd 執行副本之 `toolg/gDistRollup.mjs`;該腳本以 cwd 相對之 `./src`、`./dist` 運作,於是讀 repo 之 src、寫 repo 之 dist.已以 `git show HEAD:<path>` 寫回(md5 與 npm 1.1.6 相同).**凡執行 `toolg/*.mjs` 或 w-package-tools 之建置 API,一律以 `spawn(…, { cwd })` 明確指定 cwd,且先判斷 cwd 不是 repo 根**;Bash 禁 `cd` 不等於可以忽略 cwd.(2026-11-02 依 dspec〈自有套件之發布與建置腳本〉撤「為驗發布閘門」之背景,改回標準寫法;「以 spawn 指定 cwd 執行 toolg 腳本」之教訓仍成立,即 dspec 規則 4 之作法)
- 驗證發布閘門之正確作法:在 `./tmp/<案>/` 建副本(toolg、package.json、src;HEAD 之 src 以 `git show HEAD:<path>` 取出),以副本為 cwd 執行實際之 gDistRollup;副本在 repo 內,裸引用會向上解析到 repo 之 node_modules,不必 junction.(2026-11-02 依 dspec〈自有套件之發布與建置腳本〉撤,改回標準寫法:「驗證發布閘門」之說不再成立,gDistRollup 無閘門;「副本在 repo 內、裸引用向上解析、以副本為 cwd 執行」之作法仍沿用於測試,見下方 2026-11-02 節)

### 測試寫法
- T2 之建置走子行程(`test/tools/buildDist.mjs`),cwd 為 `test/_tmp/unit-entryDist/`,其內放 package.json 副本(rollupFile 之 getPks 讀 cwd 之 package.json 作 banner);rollupWorker 之 `temp-*.js` 亦落於此.mocha 單檔建置約 15 s.(2026-11-02 依 dspec〈自有套件之發布與建置腳本〉撤,改回標準寫法:`test/tools/buildDist.mjs` 與 `toolg/distConfig.mjs` 已刪,改為副本並指定 cwd 執行 `toolg/gDistRollup.mjs`)
- vm 模擬瀏覽器時,沙箱物件之 toString 為 `[object Object]`,與真 Window 不同(例如 wsemi haskey 在 vm 為 true、在瀏覽器為 false),vm 測試之外仍須真 Chromium 驗收.
- vm 內產生之陣列與本 realm 原型不同,`assert.deepStrictEqual` 會判不等;先 `JSON.parse(JSON.stringify(v))` 正規化.
- eslint(standard)會抓 `Object.defineProperty` 只給 setter(accessor-pairs)與 export 清單尾逗號(comma-dangle exports never).
- 已知產品缺陷之測試以 `this.skip()` 標 pending(例如 D11),不寫成放行之斷言.

### 產品事實
- writeTiff 之 D11:geotiff 之 writeArrayBuffer 依值之 TypedArray 型別寫入(`geotiffwriter.js:316-317`),與 metadata 之 BitsPerSample 無關;writeTiff 宣告 8 位元卻給 Float32Array,讀回值錯.以「寫出後用 geotiff 讀回」之探測才看得出來,只驗檔案存在與檔頭會漏掉.(run03 已改宣告 32/3 修正,見下節.)
- 複審者之探測腳本可沿用:以 node 讀原檔、做字串替換後寫成自己之副本(`tmp/run02/make-acc-scripts.mjs`).替換時要先換完整路徑,再換通用片段,否則會把寫死之路徑換壞;本次 AMD 案即因此一度誤報。

## 2026-10-14 實作 run03(D11:writeTiff 改 float32)

- geotiff 3.0.5 之 `writeArrayBuffer(values, metadata)`:BitsPerSample/SampleFormat 未給時依值之型別推得(Float32Array → 32/3),給了就照給的寫入檔頭,但資料仍依值之型別寫(`geotiffwriter.js:316-317、420-474`);兩者不一致時檔案可寫出、讀回值卻錯.其預設:Compression 1、PlanarConfiguration 1、ExtraSamples 0、SamplesPerPixel=[波段數]、PhotometricInterpretation 單波段為 1(`:366-370、428-448`).
- 讀回驗證用 `img.getFileDirectory().getValue('<標籤>')`、`getBitsPerSample(i)`、`getSampleFormat(i)`、`getSamplesPerPixel()`、`readRasters()`;比對浮點值以 `Math.fround` 取 float32 值(0.1 → 0.10000000149011612).
- `Float32Array` 轉型:`null`→0、`undefined`/`NaN`→NaN、數字字串→數值.
- GeoTIFF 1.1(OGC 19-008r4)Req 8.1:檔案 SHALL 含 GTModelTypeGeoKey;geotiff 寫入端在呼叫端已給 GeographicTypeGeoKey 時不會補,本套件輸出因而缺此鍵(D12,待裁示).GTRasterTypeGeoKey 為 highly recommended.geotiff.js 用 1.0 鍵名(投影為 `ProjectedCSTypeGeoKey`).
- 探測結果只印在 console 就無法被複核:報告要引用之數據一律另存檔(本次 dist 讀回與 null/NaN 探測於定稿前重跑,存為 `tmp/run03/dist-readback.json`、`probe-nodata.log`).定稿前逐項核對報告之數字與紀錄檔(本次因而更正 `package.json` 之增刪歸屬:+2/−2 與 lockfile +10/−10 為主控先前之相依更新).

## 2026-10-14 實作 run04(D12:writeTiff 之 GeoKey、RasterType 與原點)

### 以 GDAL 實測 GeoTIFF(本機無 GDAL/QGIS/rasterio 時)
- 用 gdal3.js(GDAL 之 WASM 版,2.8.1,約 42 MB):`npm i gdal3.js@2.8.1 --prefix <repo>/tmp/<案>/gdaljs --no-audit --no-fund`,只裝在 tmp,不進專案依賴.
- Node 用法:`require('<...>/gdal3.js/node.js')` 得 `initGdalJs`;**`initGdalJs({ path })` 之 path 會被接在 cwd 之後**,須給相對 cwd 之路徑(給絕對路徑會變成 `<cwd>\C:\...` 而找不到 `gdal3WebAssembly.data`;不給則找 `<cwd>/node_modules/gdal3.js`).`(await Gdal.open([fp])).datasets[0]` → `await Gdal.gdalinfo(ds, ['-json'])` → `Gdal.close(ds)`.
- gdalinfo 之 JSON 若含 `nan`(例如原點為 NaN),gdal3.js 解析失敗而拋錯,探測要包 try/catch.
- GDAL 之 `geoTransform` 恆為像素角;PixelIsPoint 檔讀入時 GDAL 自行平移半格(RFC 33),故像素中心一律以 `gt0 + (i+0.5)·gt1`、`gt3 + (j+0.5)·gt5` 計.

### 事實
- **缺 GTModelTypeGeoKey 時 GDAL 讀不出座標系統**:run03 版輸出被讀為無名稱之 ENGCRS,並報 `PROJ: proj_get_ellipsoid: CRS has no geodetic CRS`;補上後讀為 GEOGCRS WGS 84(4326)、TWD97(3824)或 PROJCRS「TWD97 / TM2 zone 121」(3826).
- geotiff.js 之 `getOrigin`/`getBoundingBox`(`geotiffimage.js:860-878、963-975`)、OpenLayers 10.11.0 `ol/source/GeoTIFF.js`(第 153-155 行)、georaster 1.6.0 `src/parseData.js`(第 87-91 行)皆以 ModelTiepoint 為左上角,不依 GTRasterTypeGeoKey 平移;只有 GDAL 處理 PixelIsPoint.故點值網格以「PixelIsArea＋原點外推半格」編碼,各讀取端皆正確.
- geotiff 寫入端以 SHORT 寫 GeoKey(`globals.js:305-315`),大於 65535 之代碼被靜默截斷(102100 → 36564、65536 → 0).
- interp2Grid 之格點自 xmin、ymin 起算(`x = xmin + ix·dx`),ymax 一般不在格點上(interp2Raster 之資料範圍即如此);以 `(xmin, ymax)` 當左上角會偏半格以上.

### 流程教訓
- run02/run03 我照抄既有之 `ModelTiepoint: [0,0,0,xmin,ymax,0]`,把「ymax 為影像上側邊界」寫進 JSDoc,範例與測試也用了與 interp2Grid 不一致之參數(xmin 10、xmax 13、xnum 3).這是把既有碼當規格(全域規範 §2.1 第 5 條).函數參數若與另一函數之回傳對應(writeTiff 之參數即 interp2Grid 之回傳欄位),**要先讀產生端之語意再寫文件與測試**.
- 測試要能分辨地理參照:以值記錄格點索引(`v = ix·1000 + iy`),讀回後以讀取端之語意求每一像素中心並與格點比對;只比對原點常數抓不到「範圍不整除」之偏移.

## 2026-11-02 gis267(toolg 改回 dspec 標準寫法;測試改為副本並指定 cwd 執行 toolg 腳本)

- **測試驗建置之作法**:把 `src`、`toolg`、`package.json` 複製到 `test/_tmp/<案名>/`,以 `spawn(process.execPath, ['./toolg/gXXX.mjs'], { cwd })` 執行(helper `test/tools/runNode.mjs`);副本在 repo 內,裸引用向上解析到 repo 之 `node_modules`,不必 junction;建置訊息取子行程之 stdout＋stderr,再以正則找 `could not be resolved`、`No name was provided for external module`.
- **變異要能打到被測腳本本身**:驗 `gPackageIndex` 時,副本若先刪掉 `src/WGis.mjs`,`_.pull(ltfs, fnIndex)` 即成空操作,改壞它測試仍綠(8 組變異中唯一首輪未紅者);副本須放佔位之 `WGis.mjs` 供腳本覆寫.
- **已安裝 w-package-tools 1.1.21**:`rollupFiles` 內建 `cleanFolderStrict`,且「未列 `external` 且無法解析之裸引用」建置即失敗(其 JSDoc 第 29 行),故 UNRESOLVED_IMPORT 類問題多半在建置階段即以非 0 結束;無 `genDocsExams.mjs`,主控未提交之 `toolg/gDocsExams.mjs` 在此機執行得 `ERR_MODULE_NOT_FOUND`.
- **在套件根實跑建置會動到受追蹤之 `dist/`、`docs/`**(`cleanFolder.mjs` 清空兩者):實跑前先備份於 `./tmp/<案>/before/`,實跑後比對(`w-gis.umd.js` 與 `.map` 位元組相同;`interp2.wk.umd.js` 僅 rollupWorker 隨機暫存識別字不同;docs 每檔僅 JSDoc 時間戳一行不同),再自備份還原,避免工作樹多出無實質差異之產物.`quiet-run` 以 cmd 執行,`./node_modules/.bin/jsdoc` 之寫法不通,改 `node node_modules/jsdoc/jsdoc.js -c .jsdoc`.
- 測試鎖排隊曾達 8 分鐘,測試前先備妥全部改動,避免重複排鎖.

## 2026-11-02 r3gis(interp1 交給 wsemi 之值先清理;wsemi 第 3 輪下游先行)

- **wsemi 第 3 輪尚未發布時的前瞻驗證作法**:在測試工具寫「嚴格版」替身,以 `node:module` 的 `register` 載入 ESM 解析鉤,只把 `src/interp1.mjs` 對 `wsemi/src/interp1.mjs` 的引用導向替身(鉤以 `parentURL` 結尾 `/src/interp1.mjs` 且不含 `/node_modules/` 判斷,替身自己仍引用真實 wsemi,不會迴圈);測試在子行程(`--import` 該鉤)跑案例集並輸出 JSON,同一案例集另跑真實 wsemi,兩者結果字串相等.行程內無法 mock ESM 的靜態引用,子行程＋解析鉤是不改 src 的唯一接縫.
- **替身要有兩種變體**:契約只說「無效元素原位 `{err}`」,未說物件／陣列元素如 `{ x }` 是否仍收;`faithful`(同 wsemi 現行取值)下修前碼結果與修前相同(0 差異),只有 `numberOnly`(物件、陣列元素亦無效)下修前碼才變(109 案中 76 案);所以單看「結果相同」會漏,須同時記錄交給 wsemi 之值(替身內的偵測,斷言皆為有限 number)才抓得到修前碼把 `[{ x, ind }]` 物件陣列交給 px 的做法.
- **舊判定的實害(修前實測)**:`isnum`＋`toNumber` 讓 `'0x10'` 變 16、`'0b11'` 變 3、`'1e-400'` 變 0 參與內插;`Infinity`／`'1e400'` 當內插點會輸出 `{ x: Infinity, y: null }`,單值時經 `cdbl` 變 `{ x: 1.7976931348623157e+308, y: null }`;數據點 `y` 為 `'0x10'` 時被讀為 16,`'Infinity'` 時輸出變 `Number.MAX_VALUE`;`new Number(283)` 被當 283.
- **`interp1` 的 `{ err }` 恆以物件回傳**(早於 `_sync` 之檢查直接 return),不論 `useSync`;`_async` 的 reject 只在 `_sync` 結果含 `err` 字串時才發生,實際不會.
- **stairs 的 `opt.xMax = Infinity` 是可用功能**(最後一階延伸至無限,x 超界仍得最後一階的 y),與 dspec 第 19 項(`Infinity` 改用預設)相衝;本輪 wsemi 契約未涉及 `xMin`／`xMax`,故不動並列為已知限制 L5.
- **變異驗證腳本要處理 CRLF**:工作樹之 `src/*.mjs` 為 CRLF,多行字串替換須先把 `\r\n` 正規化為 `\n` 再套用、寫出時還原;8 個變異中 4 個因此首輪「字串未命中」而被誤當未變異.未命中必須顯式報告,不可當作通過.
- **`npm i wsemi@^<版>` 的副作用**:會把 `package.json` 結尾換行補上(原無結尾換行)、把 `package-lock.json` 頂部 `version` 同步為 `package.json` 之版號;前者以 Edit 還原,後者屬同步結果.wsemi 1.9.44 之 `interp1.mjs` 與 1.9.42 相同(行號一致,仍用 `isnum`),修前碼在兩版下 109 案輸出位元組相同.
- eslint 的 `no-new-wrappers` 會擋測試中刻意用的 `new Number(…)`(包裝物件為無效輸入的測試對象);在測試檔頂以 `/* eslint-disable no-new-wrappers */` 並註明理由.
- 工作樹內檔案多為 CRLF(autocrlf):`Edit` 之 `old_string` 避免跨行;整檔重寫用 `Write`(LF,git 正規化後無差異).

## 2026-11-13 gis-hull(interp2NaturalNeighbor 可內插範圍與 opt.limitInsideHull;使用端 Gitea #139)

- **「凸包外為 null」只是註解之原意,實作從來是正方形**:`interp2Normalize` 之 `st` 把 x、y 以同一邊長(較大範圍)正規化,`interp2NaturalNeighbor` 之 `vbox=[0,0,scale,scale]` 只為讓 d3 的 Voronoi 有界,`getNz` 只擋 vbox 外.修前之外推值(正方形內、凸包外)隨遠點增減而變(10 點範例 `(600,500)`:220.48 → 另加 1 個遠點 147.55).見規則帳本 R-NN1.
- **凸包內靠邊界點之值也受正方形影響**(提案說「凸包內抽樣點不變」,抽樣不足):量法=複製 `src` 到 `./tmp/`,把兩處 `.voronoi(vbox)` 改成放大之外框(`[-K·scale, -K·scale, (K+1)·scale, (K+1)·scale]`,判定範圍之 `vbox` 檢查不動),比對凸包內點.凸包內點之區塊於「距凸包邊 d、邊長 L」時外接圓半徑約 `L²/(8d)`,稀疏資料(10 點、範圍 1130)下大於正方形邊長者甚多;K=0、1、3、10 之值逐步收斂(`(1050,201)`:106.1、116.6、137.7、141.6).`K=100` 之隨機點比對中曾見 polybooljs 印 `Zero-length segment detected`(推測外框過大使其容許誤差失準,未逐點查證),K≤10 之結果才拿來當收斂依據.此為既有行為,任務限制凸包內之值不得改,故只文件化(L6).
- **d3-delaunay 對共線點之處理**:`Delaunay.from` 遇全部共線會對座標加約 `1e-8·長度` 之 sin／cos 擾動,`hullPolygon()` 回傳 3 個帶擾動之頂點(窄凸包,首尾相同),不是原始點;2 點、1 點回傳 `[[a],[b],[a]]`、`[[a],[a]]`.故凸包判定不可直接用它.≥3 點共線時修前碼仍給數字(3 點水平共線 `(0.5,0)` → 1.496,精確線性應為 1.5),其值受擾動影響,不可信;2 點時 d3 之座標不被擾動(外審 terra 實測 `Delaunay.from` 前後 `points` 相同),修前之數字(`(0.5,0.4)` → 1.466)是退化輸入之副產物,不可一概歸因於擾動.
- **自建凸包之寬度判準**:`width = 2·(面積之 2 倍)/周長`(狹長三角形約為真寬度);用「首點與末點之直線」量寬度會在近垂直線上選錯軸,所以不用.容許距離以「點至邊所在直線之外側距離 ≤ 1e-9·scale」計(與邊長無關),比外積門檻 `1e-12·scale²` 穩定.
- **浮點使邊上之點略偏外側**:十進位小數之邊上點(如 `(330.579, 8.025)` 在 `(174,3)-(953,28)` 上)正規化後外積為負之機率不低(取 t=i/2000 掃描,約 40% 在 0 容許距離下被判在外),所以必須有容許距離;測試以此類點鎖定(變異「容許距離=0」於第一版測試仍存活,補此案後才被殺).變異驗證時,**存活之變異要回頭找「能區分它之輸入」,不是改容許**.
- **測試對照修前碼之作法**:`unit-interp2NaturalNeighborHull.test.mjs` 與 `unit-makeHullTester.test.mjs` 以環境變數 `W_GIS_SRC_DIR` 指定 `src` 資料夾(`git archive HEAD src | tar -x -C ./tmp/<案>/orig` 取修前碼;變異碼同法複製後以 Edit 改);經 `quiet-run` 時直接在 Bash 加環境變數前綴(`W_GIS_SRC_DIR=... node quiet-run.mjs ...`),會繼承至 cmd 子行程.修前碼(外審修正後之最終測試)30 案紅(預設值、凸包外、極端 scale 之凸包外等),其餘 22 案綠(= 期望值確為修前實測值).
- **外審(terra,max)找到之數值穩定性問題**:凸包判定以原座標計算時,`scale: 1e-165` 之面積乘積下溢為 0(凸包內之點被當成退化而回 null)、`scale: 1e155` 之外積溢位為 NaN(`NaN < x` 為 false,凸包外之點被當成在內)、座標平移 1e9 時 shoelace 面積因抵銷而失真.作法:凸包運算前先平移並縮放為內部座標(最大範圍為 1)、面積以第 1 個頂點為基準、比較用取反寫法使 NaN 判為在外;此類「外積／面積」之判定凡用原座標者都應先檢查尺度與平移不變性.另 `Infinity` 之原始點使 `interp2Normalize` 之範圍為無限,修前碼對內外點皆回 2.5(無意義值),不可當作「凸包內之既有值」而保留.
- **以獨立判準交叉**:測試用 `@turf/turf` 之 `convex`＋`booleanPointInPolygon` 判凸包內外(隨機點不落邊界),不用被測之凸包函數自證.
- **舊缺陷(L7,已於 2026-11-13 gis-l7 修正)**:`funInterpFragments` 之 `msg.funInv` 內部呼叫 `inv(vv, 2)`,`dir` 只收 `'x'`、`'y'`、`'z'`,實際呼叫會拋 TypeError 而該點回 null(被 `addPoint` 之 try/catch 吞並 `console.log`).`g_interp2NaturalNeighbor.mjs` 之註解曾示範 `msg.funInv(msg.v)`,實際跑不通.
- **L7 根因與軸之確認(勿臆測)**:`git log -S"inv(vv, 2)"` 追到 b967f01(2025-01-07 加 `funInv`):當時 `interp2Normalize` 之 `st` 為陣列 `[x, y, z]`、`inv(iv, i)` 以索引取值,`2` 即 z 軸;後 65d806d 把 `st` 改為以 `'x'`、`'y'`、`'z'` 為鍵,此呼叫端漏改.`msg.v` 為「各鄰點 `rA*z` 之總和」,z 已正規化,故還原軸為 `'z'`.**測試以 x、y、z 三軸之 min 互異(21、-378、22)區分所還原之軸**(錯軸變異 `'x'`、`'y'` 皆被殺).`funInv` 僅供讀取:回呼回傳 `msg.funInv(msg.v)` 會被 `itv` 內之 `inv(nz, 'z')` 再還原一次(實測 97.29 → 22107.85),JSDoc 範例註解與 `g_` 檔已註明.
- **流程教訓**:`Write` 之 `file_path` 含中文資料夾時逐字複製(`開源`≠`开源`):曾因簡體字在 `C:/opensrc/` 下多建了孤兒資料夾(含一個檔),發現後只刪自己剛建之檔與空夾並回驗;寫檔後以 `ls` 確認落點(全域 §7).另 Bash 工具之守門 hook 會擋 `cd`(連 `cd .` 也擋),一律用相對路徑或絕對路徑.

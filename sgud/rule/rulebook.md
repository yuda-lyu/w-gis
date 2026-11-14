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

### R-I1 interp1 交給 wsemi 之值須先清理為有效數字(2026-11-02,r3gis;排程第 271 項,wsemi 第 221 項第二批第 3 輪「下游先行」)

- **規則**:`src/interp1.mjs` 交給 wsemi `interp1` 之資料點(ps)與內插點(px)一律為「原始型別 number 且為有限數」:
  - 數據點、內插點之原值先以 wsemi `isenum` 判定,有效者以 `Number()` 取值(`toEnum`,`src/interp1.mjs:17`),無效者由本套件略過,不交給 wsemi.不用 `isnum`、`cdbl`、lodash `toNumber`(`Infinity`、`'Infinity'`、`'0x10'`、`'0b11'`、`'1e400'`、`'1e-400'`、`new Number(1)` 皆為無效).
  - 內插點以**純數字陣列**交付(`getPtsX`,:50),不再以 `[{ x, ind }]` 物件交付;故 wsemi 對 px 無效元素之處置(略過或原位 `{err}`)不影響本套件結果,`ts[k]` 與內插點恆逐點對位.
  - 單值內插點無效 → `{ err: 'psTar is not a number or an effective object or array' }`;物件／陣列內插點中之無效點略過、不輸出,全無效 → `{ err: 'psTar has no effective data' }`;數據點無效者略過,全無效 → `{ err: 'psSrc has no effective data' }`.輸出每點 `{ [keyX]: 有效數字, [keyY]: 內插值或 null }`,形狀同修前;有效輸入之結果與修前逐字相同.處置與訊息寫於 `src/interp1.mjs` JSDoc.
  - `opt.xMin`／`opt.xMax` 不屬本輪 wsemi 更動之契約,原樣交給 wsemi(`Infinity` 表 stairs 該側無界,修前即如此,見已知限制 L5).
- **站點全集**:`git grep -n -E "interp1|arrGroupByMaxmin|arrLookupByMaxmin|strTruncate" -- src` 只命中 `src/interp1.mjs`(呼叫處 :262;`arrGroupByMaxmin`、`arrLookupByMaxmin`、`strTruncate` 在本套件 `src/` 內 0 站點).已套:`src/interp1.mjs`.刻意不套:`ptsXtoArr`／`ptsXYtoArr`(公開模組,仍供 `calcDelaunay`、`calcVoronoi`、`interp2NaturalNeighbor`、`interp2Kriging` 使用,不傳給上列 wsemi 函數,行為不在本輪範圍).
- **前瞻驗證**:wsemi 第 3 輪尚未發布時,以測試工具內之「嚴格版」替身(`test/tools/wsemiInterp1Strict.mjs`,契約:px 陣列無效元素原位 `{ err: 'invalid px[<i>]: must be a valid number' }`、長度恆等於 px)經 ESM 解析鉤(`test/tools/registerWsemiStrict.mjs`)取代 `src/interp1.mjs` 對 wsemi 之引用,於子行程跑案例集(`test/tools/interp1Cases.mjs`).替身有 `faithful`(元素取值同 wsemi 現行)與 `numberOnly`(物件、陣列元素亦視為無效)兩種變體;並記錄交給 wsemi 之值,斷言無「非原始 number 有限數」者.
- **盤點指令**:`git grep -n -E "interp1|arrGroupByMaxmin|arrLookupByMaxmin|strTruncate" -- src`;`npx mocha --no-parallel test/interp1.test.mjs test/unit-interp1WsemiStrict.test.mjs --timeout 180000`.
- **測試**:`test/interp1.test.mjs` 案 7～19(有效數字字串、內插點／數據點無效值之略過與對位、單值無效、全無效);`test/unit-interp1WsemiStrict.test.mjs`(替身契約 4 案、真實與嚴格版 wsemi 下 109 案結果相同且不拋錯、交給 wsemi 之值皆為有限 number 3 案).

### R-NN1 interp2NaturalNeighbor 之可內插範圍與 opt.limitInsideHull(2026-11-13,gis-hull;排程第 451 項,使用端 Gitea #139)

- **事實(實測,2026-11-13,修前碼)**:實作之可內插範圍為「正規化正方形」(以 x、y 各自範圍中點為中心、邊長為兩者範圍較大者,`src/interp2Normalize.mjs:98-120` 之 `st`;`vbox = [0,0,scale,scale]` 裁切 Voronoi,`getNz` 只排除 vbox 外之點),非凸包.凸包外而正方形內之點得外推值,其值隨正方形大小(遠點增減)而變;正方形外為 null;共線 3 點、2 點之線上點與線外(正方形內)點皆有值(無二維三角剖分之退化輸入之副產物;≥3 個精確共線點時 d3-delaunay 另加約 1e-8 擾動,2 點時座標不被擾動);單一相異點(x、y 範圍皆為 0)不正規化而原值使用,裁切框仍為 `[0,0,scale,scale]`,故只在查詢座標落於其內時有值.原範例註解「內插點於原始點所形成最小凸多邊形之外, 故無法內插」把正方形外之 null 誤歸因於凸包.
- **2026-11-14 修訂(gis145,使用端 Gitea #145)**:凸包內改為 Sibson 精確權重(R-NN2),不再以正方形裁切;`false` 時之凸包外改為投影至最近凸包邊;正方形不再限制任何點.下列 a、b、c、d、d3 已依新行為改寫;修訂前之條文(凸包內值不變、`false` 時之外推、正方形外恆 null)見 git 歷史.
- **規則**:
  - **R-NN1-a 凸包內之值不受選項影響**:預設、`true`、`false` 三者凸包內(含邊上與容許值內)之結果逐字相同,且為 Sibson 精確值(R-NN2;期望值為有理數精確解,相對 1e-12).1.1.27 之裁切值(如 `(1050,201)` 為 106.116,精確 141.5637)已不再保留(L6 已修).
  - **R-NN1-b `opt.limitInsideHull`**(布林,B1:只收 `true`、`false`,其餘含 `'true'`、`1`、包裝物件視為未給;**預設 `true`**).`true` 時凸包外(超出容許值:正規化正方形邊長之 1e-9 倍,以點至邊所在直線之外側距離計)者 z 為 null 且不呼叫 `funInterpFragment(s)`;`false` 時凸包外者投影至最近凸包邊(線段),給該邊兩端點線性權重(投影落於端點者只給該端點),`method` 為 `'projection'`.
  - **R-NN1-b2 凸包邊上與容許值內**:恰在凸包邊上(精確 orient2d)或凸包外而在容許值內者,一律取最近凸包邊兩端點線性(`'hullEdge'`),與選項無關;此為凸包內 Sibson 權重於邊上之極限,凸包內外連續.**容許值以至最近凸包邊(線段)之歐氏距離判定**(2026-11-14,外審 Argon 之線索):`_makeHullTester` 之「至各邊所在直線之外側距離」於銳角頂點之外會容許遠大於容許值之點(針狀三角形頂點外 0.05 仍判為在內,1.1.27 起即如此);`_makeHullTester` 只再用於無凸包面積之判定.
  - **R-NN1-c 正方形不再限制**:`true` 時正方形外之點必在凸包外而為 null(同 1.1.27 之結果);`false` 時正方形外之點亦投影而有值(1.1.27 為 null).
  - **R-NN1-d 退化凸包**:原始點不足 3 個相異點或全部共線(凸包寬度約 `4×面積/周長` 不大於容許距離;**寬度 ≤ 正方形邊長 1e-9 倍之非零面積凸包亦視為共線**,以免十進位小數之共線點因捨入誤差〔約 1e-16〕時而為共線時而為窄凸包)為無凸包面積:`true` 時除座標與原始點相同者(回傳該點 z)外皆 null;`false` 時沿直線線性內插(直線取 x 或 y 範圍較大之軸上兩端點之連線,投影位置相同之原始點均分,超出兩端取端點,`'line'`).判定用自建凸包(`src/_makeHullTester.mjs`,monotone chain),**不用 d3-delaunay `hullPolygon()`**(共線時回傳帶約 1e-8 擾動之窄凸包).
  - **R-NN1-d2 數值穩定**:凸包運算前先平移並縮放為以最大範圍為 1 之內部座標(面積以第 1 個頂點為基準),結果不受座標平移量與 `scale` 大小影響(外審 terra 實測:`scale: 1e-165` 面積下溢、`scale: 1e155` 外積溢位為 NaN 而被當成在內,座標平移 1e9 時以原座標計算之面積抵銷;皆已改);原始點含非有限數或座標範圍溢位者全部點不可內插(null＋`funInterpError`,reason `nonFiniteSourceCoordinate`);查詢點內部座標非有限數者 null＋`funInterpError`(`nonFiniteCoordinate`);運算結果為 NaN 者一律判為在外(取反寫法 `!(c >= -tol)`).
  - **R-NN1-d3 特例**:①查詢點與原始點座標浮點相等者權重 1(`'vertex'`)且呼叫回呼(1.1.27 以快取回傳而不呼叫);②回傳之 z 經正規化往返而有浮點誤差(如 `0.1` → `0.09999999999999432`);③同座標多個原始點取最後一個(其餘不出現在回呼);④重複查詢點各自計算、各自呼叫回呼(1.1.27 第二次起以快取回傳而不呼叫);有狀態之回呼結果隨呼叫順序而變.
  - **R-NN1-e 說明**:`src/interp2NaturalNeighbor.mjs` JSDoc〈算法〉(1)~(4)、〈可內插範圍〉(1)~(12)、各 `@param`、範例;`src/interp2.mjs`(轉傳整份 opt,可內插範圍與 `limitInsideHull` 已改寫)、`src/interp2Kriging.mjs`(不受限)、`src/interp2Normalize.mjs`(正方形只用於 z 之正規化)、根目錄 `g_interp2NaturalNeighbor.mjs`、`g_interp2.mjs` 之範例值、README〈Notes〉〈Breaking changes〉.
- **預設值之審定(`true`,破壞性變更)**:①該函數引為參考之 Tinfour 文件明載「It does not support extrapolation」,範例註解與被註解掉之 hullPolygon 程式亦顯示原意為凸包;②凸包外之值取決於正規化正方形(實測 `(600,500)` 於 10 點範例為 220.48,加 1 個遠點使正方形放大後為 147.55),無意義而不穩;③本套件既有 32 案(`interp2NaturalNeighbor`、`interp2`、`interp2Normalize`、`interp2Kriging` 測試)全數在預設 `true` 下通過,無任何測試把外推值當規格;④原則 14(不為舊行為留相容、品質優先),且非布林值視為未給時取 `true` 為失敗保守側(寧回 null 不回捏造值);⑤`false` 保留為明示取得外推值之出口(任務與 Gitea #139 要求有此選項).
- **同型盤點**(指令:`git grep -n -E "interp2Normalize|\.voronoi\(|hullPolygon|interp2NaturalNeighbor" -- src`):已套 `src/interp2NaturalNeighbor.mjs`;`src/interp2.mjs` 轉傳整份 opt(同改:JSDoc 註明);`src/interp2Kriging.mjs` 用 `interp2Normalize` 僅作數值正規化、不裁切、凸包外與正方形外皆外推(不適用,JSDoc 註明,測試鎖定 `limitInsideHull` 對其無效);`src/interp2Grid.mjs`、`src/interp2Raster.mjs` 只經 `interp2Kriging`(不適用);`src/calcVoronoi.mjs:272-276` 之 `vbox` 為輸出 Voronoi 區塊之外框,非內插(不適用).
- **盤點指令**:同上;`npx mocha --no-parallel test/unit-interp2NaturalNeighborHull.test.mjs test/unit-makeHullTester.test.mjs --timeout 180000`.環境變數 `W_GIS_SRC_DIR=<src 資料夾>` 可指定修前碼或變異碼對照(兩檔皆支援).
- **測試**:`test/unit-interp2NaturalNeighborHull.test.mjs`(R-NN1-a~l:凸包內不變且等於修前值、凸包外、正方形外、邊界與浮點、回呼、非布林值、退化、三角形、scale 與座標尺度與順序與無效點、陣列逐點、以 turf 為獨立判準交叉、經 interp2 與 kriging;n 極端 scale 與座標〔1e-165、1e155、平移 ±1e9、範圍溢位、含 Infinity 之原始點〕;o 容許距離與極窄凸包之公開行為;p 有狀態回呼);`test/unit-makeHullTester.test.mjs`(R-NN1-m:凸包判定函數,含尺度與平移不變、非有限數、與 turf 隨機交叉);`test/unit-entryDist.test.mjs` 案 3、案 5(重建之主產物與 worker 產物亦具 `limitInsideHull` 行為).2026-11-14 起凸包內之期望值為有理數精確解(相對 1e-12)、`false` 之凸包外期望值為獨立計算之最近凸包邊兩端點線性(`projZ`);1.1.27 之實測值不再作期望值.變異驗證(2026-11-13,11 個變異)見 git 歷史;本輪之變異見 R-NN2.

### R-NN2 interp2NaturalNeighbor 凸包內之 Sibson 權重(2026-11-14,gis145;使用端 Gitea #145)

- **事實(實測,1.1.27)**:凸包內權重有誤之三個機制皆屬實,逐點以「1.1.27/精確且同樣裁切於正方形/精確不裁切」三者分離:③正方形裁切為一般資料之主因(10 點範例凸包內格點 485/1410 點權重差 ≥0.05、200 隨機點 67/400、鑽孔樣式 25/300,皆只因裁切);①多邊形交集拋錯被吞(`src/intersectPolygon.mjs:97` 之 polybooljs 絕對容許值 1e-12 拋 Zero-length segment,`interp2NaturalNeighbor` 舊碼 `catch` 後記 0 再等比放大,最大放大 25 倍)與 ②d3-delaunay 絕對門檻(`|2倍有號面積|<1e-9` 視為退化,`node_modules/d3-delaunay/dist/d3-delaunay.js:1079`)只在極小幾何(正規化座標下群半徑 ≲1e-5)造成大差:群內 119/120 點差 ≥0.05,把②之門檻改為恰為 0 後只消失 3 點,其餘 116 點①仍觸發.量測腳本與輸出見任務 gis145 報告.
- **規則**:
  - **R-NN2-a 算法**:Liang & Hale(2010)——一次建 Delaunay 三角網(delaunator),以 robust-predicates 之精確 `incircle` 翻邊至 Delaunay(delaunator 之 `inCircle` 為一般浮點);反向三角形先翻邊修復,修不了或有點未入網則以只用精確 `orient2d` 之掃描線法重建再翻邊.每點以最近原始點周圍與包含內插點之三角形為種子 BFS 衝突三角形(精確 `incircle`),由空腔邊界得有序自然鄰點;以內插點為原點之外心多邊形(`C(k-1)`、扇形外心、`Ck`)以鞋帶式求被奪面積;外心以最長邊之對角頂點為基準.不取 Voronoi 多邊形、不作多邊形交集、不裁切.
  - **R-NN2-b 內部座標不捨入**:`u=(v-t)·f`,`f` 為 2 之冪次、`t` 僅於全部原始點同號且最大絕對值不大於其 2 倍時取絕對值最小者(Sterbenz),否則 0;故三角網、判定式與權重等同以原始座標計算(草案之 `(x-min)/range` 會捨入,使極小群之權重差達 6e-3).
  - **R-NN2-c 偵測**:權重有限、空腔邊界為單一封閉迴圈且各衝突三角形三頂點皆在邊界上、被奪面積不小於 −1e-12×總面積、局部座標偏離 |Σw(p−x)| ≤ 1e-12×Σw|p−x|(**以局部尺度正規化**;皆以取反寫法攔 NaN).結構不符 → null＋`funInterpError`(`cavity:*`);數值不過 → 有理數(BigInt)精確重算(`'sibsonExact'`),仍不過或無 BigInt → null＋`funInterpError`.各檢查皆為必要條件:局部座標於鄰點數 >3 時攔不到錯誤之權重分配,故另加結構檢查;權重和為 1 因除以總和而恆成立,不作檢查.**局部尺度正規化之由來(外審 terra 之反例)**:草案以最遠鄰點距離正規化、容許 1e-9;內插點夾於相距約 1e-13 之兩點之間時新區塊寬約 1e-13、長約 0.5,外心座標之浮點誤差(約 1e-16)相對於寬度達 0.3%,權重差 1.5e-3 而全部檢查通過(誤差方向之長度被遠方鄰點之距離稀釋).改以局部尺度、容許 1e-12 後改走精確算法而得 0 差;代價為內插點距原始點小於約局部間距之 1e-4 倍時亦改走精確算法(浮點權重之絕對誤差約機器精度,相對於局部尺度過大;只影響速度,隨機查詢約佔 1e-7).曾試以「鞋帶項絕對值和」之條件估計與 Kahan 外積改善,前者於 2.9 萬點壓力 0 次觸發、後者對精度與備援次數無可量之差,皆未採用.
  - **R-NN2-c2 條件估計(外審 agy-hydrogen 之反例)**:原始點呈傾斜之極狹長帶(寬長比 1e-4~1e-6)時,衝突三角形狹長而外心遠達範圍之 1e3~1e5 倍,外心座標之浮點誤差使權重差 1.2e-12~8.2e-12,局部座標檢查測不出;加「8×機器精度×衝突三角形外接圓半徑平方和÷總面積 ≤ 1e-12」,超過者走精確算法.實測(`tmp` 腳本 `sliverCond.mjs`):一般隨機、凸包邊附近、近共線凸包之估計值 ≤ 8.4e-14(無誤報),狹長帶中誤差 >1e-12 者估計值皆 ≥ 7.8e-11.兩檢查互補:只用條件估計時綜合模糊測試之最大差 5.1e-11,兩者並用為 1.1e-13.
  - **R-NN2-g 其餘輸入**:內部座標絕對值 >1e100 之查詢點直接投影(不經走訪;robust-predicates 於約 1e146 以上溢位為 NaN,原誤判為在內而回 `cavity:*`);走訪遇 NaN 判為定位失敗;投影時各邊距離皆溢位者 `true` 為 null、`false` 為 `projectionFailed`.回呼回傳非有限數(含 null、字串)者該點 null.`opt.scale` 非數字、非正數或非有限數視為未給(K3;原由 `interp2Normalize` 拋錯).
  - **R-NN2-b2 極端尺度**:縮放因子拆為兩個 2 之冪次依序相乘(範圍為次正規數時單一 2^e 溢位);投影參數先以邊之最大分量縮放再平方、邊距以 `Math.hypot` 比較(長度約 1e-170 以下之凸包邊,其平方下溢使參數錯為 0;外審 terra 之探測).
  - **R-NN2-d 不用 BigInt 字面值**:BigInt 常數於首次走備援時才建立(`BN.n0` 等),不支援 BigInt 之環境仍可載入整個套件,走到備援時該點 null＋告知.
  - **R-NN2-e 告知**:`opt.funInterpError({ indTar, x, y, reason })`(F1,非函數視為未給;拋錯以 console.log 輸出後續行);未給時 `console.warn` 彙總一次,只含點數與原因代碼(dspec〈診斷輸出與遮罩〉D2:不含座標、指標等資料值).
  - **R-NN2-f 回呼**:`msg.method` ∈ `'sibson'`、`'sibsonExact'`、`'hullEdge'`、`'projection'`、`'vertex'`、`'line'`;`ps` 只列權重 >0 者;線性類之 `area`=`areaRatio`、`areaTotal`=1;Sibson 之 `area`、`areaTotal` 為未裁切面積換算至正規化座標(0 至 scale).
- **精度(實測,2026-11-14 最終版)**:與有理數精確解(原始座標)之最大權重差 5.4e-15(對抗案例 12 類 3,251 點:內部邊 h→0、共圓、凸包邊內側 h 1e-2~1e-15、極小群 1e-5~1e-13、近共線凸包、靠近頂點、兩點相距 2^-52~1e-4、TWD97 量級、平移與縮放;其中 158 點走精確備援),非有限數 0、例外 0;模糊測試:夾於極近兩點之間 12,100 例最大 3.1e-14,近點對／近共圓／傾斜狹長帶綜合 2,000 例最大 1.1e-13,外審 opus 之產生器 12,000 點差 >1e-12 者 0;壓力 116,186 點告知 0(精確備援 37,273,壓力集刻意將半數查詢點置於原始點附近;隨機查詢之備援約 0).
- **盤點指令**:`npx mocha --no-parallel test/unit-interp2NaturalNeighborSibson.test.mjs test/interp2NaturalNeighbor.test.mjs --timeout 180000`;`W_GIS_SRC_DIR=<src 資料夾>` 可對照(Sibson 測試支援;cmd 下寫 `cmd //c "set W_GIS_SRC_DIR=<夾>&& npx mocha …"`).
- **判準**:`test/tools/sibsonExactRef.mjs`(有理數半平面裁切,不經三角網與外心;公式 A 交集與公式 B 差集只共用裁切原語;自身以解析解、精確不變量〔Σa=總面積、Σa(p−q)=0〕、公式 A=B、平移與縮放逐位元相同驗過).
- **測試**:`test/unit-interp2NaturalNeighborSibson.test.mjs`(32 案:參考解自身 3、對抗案例 13〔含須掃描線法重建之極小群、次正規數範圍〕、1.1.27 三原因 3、`ps`／凸包邊線性／銳角頂點 3、回呼與選項與查詢點之例外 5、備援與告知 5〔含夾於極近兩點之間、傾斜狹長帶〕;修前紅:對 1.1.27 為 17 紅、4 綠〔參考解自身 2、平移縮放逐位元、無字面值〕;對草案為 5 紅〔兩組極小群、①之小群、無 BigInt、字面值〕);`test/interp2NaturalNeighbor.test.mjs`(草案之 Liang & Hale 案例,其極小群之精確解已改為原始座標之值).
- **變異驗證(2026-11-14,18 個,17 個被殺)**:內部座標改回草案之捨入映射、不做 Lawson 翻邊、外心固定以內插點為基準、凸包容許值 0、停用掃描線法重建、`ps` 含權重 0 者、投影不夾於線段、局部座標改回草案(最遠距離正規化、1e-9)、單一縮放因子、投影不先縮放、容許值改回「至邊所在直線之距離」、移除極遠查詢點之預檢、移除條件估計、移除回呼非有限數之檢查、移除 scale 之檢查、停用精確備援、共線時不均分皆被殺;「移除負面積檢查」存活(局部座標檢查已攔下同一批輸入,於已知輸入上行為等價,保留為廉價之必要條件).以 `W_GIS_SRC_DIR` 跑 Sibson 與 Hull 兩檔(腳本於任務 gis145 之證據資料夾,未入版控).

## 二、已知限制(文件化)

| ID | 內容 | 落點 |
|---|---|---|
| L1 | `dist/interp2.wk.umd.js` 無法由 bundler(web)打包(rollupWorker `runin:'both'` 必然外部引用 `worker_threads`),供 `<script>` 與 Node 使用 | `src/interp2.mjs` JSDoc |
| L2 | UMD 之 AMD 分支依賴 `@turf/turf`,AMD 使用者須自行提供 | 本帳本 |
| L3 | worker 產物以 blob URL 建立 Web Worker,頁面 CSP 須允許 `blob:`,否則呼叫 reject(值為 Event) | `src/interp2.mjs` JSDoc |
| L4 | 頁面已有 AMD 載入器時,以 `<script>` 載入主產物得不到 `window['w-gis']`(UMD 慣例) | 本帳本 |
| L5 | `interp1` 之 `opt.xMin`／`opt.xMax` 原樣交給 wsemi:`Infinity`、`-Infinity` 使 stairs 該側無界(最後一階延伸至無限,修前即如此)、`NaN` 使 stairs 結果全 null;wsemi 後續輪次若將此二鍵改以 `isenum` 判定,上述行為會變,屆時須重評(本輪不動) | `src/interp1.mjs`;`test/tools/interp1Cases.mjs` 案例「stairs xMax Infinity passes through」等 5 案(僅比對真實與嚴格版 wsemi 下結果一致,未釘死數值) |
| L6(已修,2026-11-14 gis145) | 原 `interp2NaturalNeighbor` 以正規化正方形裁切 Voronoi 區塊:凸包內靠近凸包邊界、原始點稀疏處之內插點,其區塊延伸超出正方形時被裁切,值與未裁切之理論值有差異(實測可差數十).已改為 Liang & Hale 算法(不取 Voronoi 多邊形、不裁切),凸包內為 Sibson 精確值,屬破壞性變更 | R-NN2;`test/unit-interp2NaturalNeighborSibson.test.mjs`〈1.1.27之三個原因〉 |
| L8 | `interp2NaturalNeighbor` 之 `limitInsideHull: false`:查詢點距原始點約 1e16 倍範圍以上時,其至各凸包邊之距離於浮點無法分辨(`1e16−1` 捨入為 `1e16`),可能投影至非最近之邊(外審 terra 之探測:正方形 [0,1]² 而查詢點 `(1e155, 0.5)` 投影至左邊).此距離之外推無實用意義,未修;若要修,改以精確 orient2d 判定查詢點落於哪一邊之條帶或哪一頂點之楔形 | R-NN2;本帳本 |
| L9 | `interp2NaturalNeighbor`:原始點間距相對於範圍小於約 1e-75 且位於原點附近(無平移)時,robust-predicates 之 `incircle` 四次項下溢,三角網或衝突判定失效;該點回 null 並 `funInterpError`(如 `cavity:noConflictTriangle`),不靜默輸出(外審 terra 之探測:1e-100 之群) | R-NN2-c |
| L10 | `interp2NaturalNeighbor`:縮放向下(範圍 >1)時,次正規數量級之座標差可能下溢為 0 而被視為同座標(去重取最後一個);1.1.27 之正規化亦同 | R-NN2-b |
| L11 | `interp2NaturalNeighbor` 回呼之 `area`、`areaTotal` 為正規化座標(0 至 scale)之面積:極端之 `scale`(如 1e-165、1e155)或極靠近凸包邊之點可下溢為 0 或溢位為 Infinity;`areaRatio`(權重)與 z 不受影響 | JSDoc〈可內插範圍〉(1) |
| L12 | `interp2NaturalNeighbor` 之共線模型(`limitInsideHull: false`)以浮點投影參數分組,相距數個 ulp 之原始點可被視為同一位置而均分(外審 terra 之探測:相鄰 1 ulp 之兩點 z 為 10、20,查詢於前者之位置得 15) | R-NN1-d |
| L7(已修,2026-11-13 gis-l7) | 原 `interp2NaturalNeighbor` 之 `funInterpFragments` 回呼收到之 `msg.funInv` 呼叫 `inv(vv, 2)`,而 `inv` 之 `dir` 只收 `'x'`、`'y'`、`'z'`,呼叫 `msg.funInv(...)` 即拋 TypeError,被 `addPoint` 之 try/catch 接住而該點回 null 並印出錯誤.根因(`git log -S`):初版(b967f01)之 `interp2Normalize` 以陣列 `st[0|1|2]` 為 x、y、z 而呼叫 `inv(vv, 2)`(2＝z 軸);後來(65d806d)把 `st` 改為以 `'x'`、`'y'`、`'z'` 為鍵,漏改此呼叫端(漏做:重構不完整).已改為 `inv(vv, 'z')`;`msg.funInv` 僅供讀取(如判斷或記錄):回呼回傳值仍須為正規化值,回傳 `msg.funInv(msg.v)` 會被再次還原(JSDoc 範例註解已載,測試鎖定).同類盤點:`git grep -n -E "\binv\(|\bnv\(" -- src` 全數站點之 `dir` 皆為字母鍵,無其他數字索引 | `src/interp2NaturalNeighbor.mjs:538-540`;`test/unit-interp2NaturalNeighborFunInv.test.mjs`(8 案;修前碼〔`inv(vv, 2)`〕與錯軸變異〔`'x'`、`'y'`〕皆 7 案紅、1 案綠〔`funInv(非數字)`回 null 之案修前即成立〕) |
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
| 1.1.27(已發布) | `interp1` 之數據點與內插點改以有效數字判定:`Infinity`、`-Infinity`、`'Infinity'`、`'0x10'`、`'0b11'`、`'0o7'`、`'1e400'`、`'1e-400'`、包裝物件 `new Number(1)` 不再被當數字.內插點為此類值時,陣列／物件形式中該點改為略過(修前輸出如 `{ x: Infinity, y: null }`、`{ x: 16, y: null }`),單值形式改回 `{ err }`;數據點為此類值時改為略過(修前 `y` 為 `'0x10'` 時被讀為 16、`y` 為 `'Infinity'` 時內插值為 Infinity、輸出經 `cdbl` 變為 `Number.MAX_VALUE`).有效輸入之結果不變 | 對齊 wsemi 之「有效數字」定義(dspec〈輸入參數之檢測機制〉§3.1),避免以 `isnum`＋`toNumber` 把非預期值當數字交給 wsemi |
| 下一版(gis145) | `interp2NaturalNeighbor`(含 `interp2` 之 `method: 'naturalNeighbor'`):①凸包內改為 Sibson 精確權重(不裁切、不作多邊形交集),凸包內之值全部改變(多數只差末位,算錯者改為正確值);②`limitInsideHull: false` 之凸包外改為投影至最近凸包邊之兩端點線性,正方形外由 null 改為有值;③凸包邊上與容許值內一律兩端點線性;④共線或不足 3 點且 `false` 時改為沿直線線性;⑤與原始點同座標之查詢點、重複查詢點皆呼叫回呼;回呼新增 `method`,`ps` 只列權重 >0 者;⑥新增 `opt.funInterpError`,無法計算之點回 null(含原會產生數字之失敗);⑦`opt.scale` 不再影響權重與可否內插,非正數或非有限數視為未給(原拋錯);⑧新增相依 `delaunator`、`robust-predicates`;⑨凸包外容許值改為歐氏距離(銳角頂點外由有值改為 null／投影);⑩回呼回傳非有限數者該點 null(原輸出 NaN、Infinity 或把 null 當 0);⑪極遠查詢點不再告知錯誤 | 原權重有三機制之錯誤(R-NN2 事實段;最大權重差近 1),不重現一次函數;每點重建三角網而慢.原則 14(不留舊行為相容) |
| 1.1.27(已發布) | `interp2NaturalNeighbor`(含 `interp2` 之 `method: 'naturalNeighbor'`)新增 `opt.limitInsideHull`,**預設 `true`**:凸包外(而正方形內)之內插點由外推值改為 `z: null`,且不呼叫 `funInterpFragment(s)`;原始點不足 3 個相異點或全部共線時,除座標與原始點相同者外皆 null(修前為退化輸入之副產物數字,非有意之內插).`{ limitInsideHull: false }` 可取回修前之值.凸包內與正方形外之值不變 | 外推值取決於正規化正方形之大小而不穩定,與函數引用之 Tinfour 文件(不支援外推)及範例註解之原意不符;原則 14(使用端 Gitea #139) |

## 四、測試與指令對照

| 規則 | 測試檔 | 單獨執行 |
|---|---|---|
| R-ENTRY-1(含副本執行 gPackageIndex)、R-ENTRY-4 | `test/unit-entrySrc.test.mjs` | `npx mocha test/unit-entrySrc.test.mjs --timeout 180000` |
| R-ENTRY-2、R-ENTRY-3、R-D9-a/b/c(產物;副本執行 gDistRollup) | `test/unit-entryDist.test.mjs` | `npx mocha test/unit-entryDist.test.mjs --timeout 180000` |
| R-WT | `test/unit-writeTiff.test.mjs` | `npx mocha test/unit-writeTiff.test.mjs --timeout 180000` |
| R-D9-a/c(邏輯)、importTurf | `test/unit-importTurf.test.mjs` | `npx mocha test/unit-importTurf.test.mjs --timeout 180000` |
| R-I1 | `test/interp1.test.mjs`、`test/unit-interp1WsemiStrict.test.mjs`(工具:`test/tools/interp1Cases.mjs`、`wsemiInterp1Strict.mjs`、`hookWsemiStrict.mjs`、`registerWsemiStrict.mjs`、`runInterp1Child.mjs`) | `npx mocha --no-parallel test/interp1.test.mjs test/unit-interp1WsemiStrict.test.mjs --timeout 180000`;環境變數 `W_GIS_INTERP1_SRC=<interp1.mjs 路徑>` 可對照他版(修前碼) |
| R-NN1(a~l 為 `interp2NaturalNeighbor`;m 為凸包判定函數) | `test/unit-interp2NaturalNeighborHull.test.mjs`、`test/unit-makeHullTester.test.mjs` | `npx mocha --no-parallel test/unit-interp2NaturalNeighborHull.test.mjs test/unit-makeHullTester.test.mjs --timeout 180000`;`W_GIS_SRC_DIR=<src 資料夾>` 可對照修前碼或變異碼 |
| R-NN2(Sibson 權重;判準 `test/tools/sibsonExactRef.mjs`) | `test/unit-interp2NaturalNeighborSibson.test.mjs`、`test/interp2NaturalNeighbor.test.mjs` | `npx mocha --no-parallel test/unit-interp2NaturalNeighborSibson.test.mjs test/interp2NaturalNeighbor.test.mjs --timeout 180000`;Sibson 測試支援 `W_GIS_SRC_DIR` |
| L7(`msg.funInv`,已修) | `test/unit-interp2NaturalNeighborFunInv.test.mjs` | `npx mocha --no-parallel test/unit-interp2NaturalNeighborFunInv.test.mjs --timeout 180000`;`W_GIS_SRC_DIR=<src 資料夾>` 可對照修前碼或變異碼 |
| 全部 | — | `npm test` |

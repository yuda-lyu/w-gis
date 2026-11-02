import path from 'path'
import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'
import rollupWorker from 'w-package-tools/src/rollupWorker.mjs'


let fdSrc = './src'
let fdTar = './dist'

await rollupFiles({ //rollupFiles預設會clean folder故得要放第1個
    fns: 'WGis.mjs',
    fdSrc,
    fdTar,
    nameDistType: 'kebabCase',
    globals: {
        //編譯給前端用的@turf為官方打包後js檔(轉b64再於前端載入), 不使用node版故需剔除
        //全域名須等於turf官方UMD設定之全域turf(帳本R-D9-b): 瀏覽器主執行緒仍走注入(importTurf依isWindow分流), 非window環境(例如Web Worker先importScripts官方turf.min.js)則由此取得turf
        '@turf/turf': 'turf',
    },
    external: [
        '@turf/turf',
    ],
})

await rollupWorker({
    name: 'interp2', //原模組名稱, 將來會掛於winodw下或於node引入使用
    type: 'function', //原模組輸出為函數, 可傳入參數初始化
    // execFunctionByInstance: true, //default, 原模組為計算函數回傳結果
    fpSrc: path.resolve(fdSrc, 'interp2.mjs'), //原始檔案路徑
    fpTar: path.resolve(fdTar, 'interp2.wk.umd.js'), //檔案輸出路徑
    formatOut: 'umd', //會提供w-leaflet-vue於html直接引用, 用es會有問題得使用umd
    bMinify: false, //因目前壓縮會導致編譯worker無法接收與回應, 故暫時關閉
})

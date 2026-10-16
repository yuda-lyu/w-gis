import path from 'path'


/**
 * 取得發布建置之選項, 為gDistRollup(發布)與測試(unit-entryDist)共用之單一出處(帳本R-ENTRY-2)
 *
 * @param {Object} [opt={}] 輸入設定物件, 預設{}
 * @param {String} [opt.fdSrc='./src'] 輸入原始碼資料夾字串, 預設'./src'
 * @param {String} [opt.fdTar='./dist'] 輸入產物資料夾字串, 預設'./dist'
 * @returns {Object} 回傳物件, 含optMain(rollupFiles選項)、optWorker(rollupWorker選項)、fpMain與fpWorker(產物絕對路徑)、externalsMain與externalsWorker(產物UMD檔頭應有之外部清單)
 */
function getDistOpts(opt = {}) {
    let fdSrc = opt.fdSrc || './src'
    let fdTar = opt.fdTar || './dist'

    //externalsMain
    let externalsMain = [
        '@turf/turf',
    ]

    //optMain
    let optMain = { //rollupFiles預設會clean folder故得要放第1個
        fns: 'WGis.mjs',
        fdSrc,
        fdTar,
        nameDistType: 'kebabCase',
        globals: {
            //編譯給前端用的@turf為官方打包後js檔(轉b64再於前端載入), 不使用node版故需剔除
            //全域名須等於turf官方UMD設定之全域turf(帳本R-D9-b): 瀏覽器主執行緒仍走注入(importTurf依isWindow分流), 非window環境(例如Web Worker先importScripts官方turf.min.js)則由此取得turf
            '@turf/turf': 'turf',
        },
        external: externalsMain,
    }

    //optWorker
    let optWorker = {
        name: 'interp2', //原模組名稱, 將來會掛於winodw下或於node引入使用
        type: 'function', //原模組輸出為函數, 可傳入參數初始化
        // execFunctionByInstance: true, //default, 原模組為計算函數回傳結果
        fpSrc: path.resolve(fdSrc, 'interp2.mjs'), //原始檔案路徑
        fpTar: path.resolve(fdTar, 'interp2.wk.umd.js'), //檔案輸出路徑
        formatOut: 'umd', //會提供w-leaflet-vue於html直接引用, 用es會有問題得使用umd
        bMinify: false, //因目前壓縮會導致編譯worker無法接收與回應, 故暫時關閉
    }

    return {
        optMain,
        optWorker,
        fpMain: path.resolve(fdTar, 'w-gis.umd.js'), //rollupFiles依nameDistType(kebabCase)與format(umd)命名
        fpWorker: optWorker.fpTar,
        externalsMain,
        externalsWorker: ['worker_threads'], //rollupWorker之runin='both'自行注入
    }
}


export default getDistOpts

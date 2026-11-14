import get from 'lodash-es/get.js'
import isbol from 'wsemi/src/isbol.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import interp2NaturalNeighbor from './interp2NaturalNeighbor.mjs'
import interp2Kriging from './interp2Kriging.mjs'


/**
 * 針對不規則二維數據進行指定內插點數值
 *
 * 另有Web Worker版產物dist/interp2.wk.umd.js(於Node使用worker_threads、於瀏覽器使用Web Worker), 供瀏覽器以script載入(掛於window['interp2'])或Node直接使用, 不支援同步模式;
 * 該產物無法由bundler(例如webpack以web為target)打包, 因其Node分支須外部引用worker_threads;
 * 於瀏覽器以blob URL建立Web Worker, 故頁面若設CSP, 須允許blob:(script-src或worker-src), 否則呼叫會reject
 *
 * 可內插範圍: method='naturalNeighbor'時, 預設(opt.limitInsideHull為true)內插點須位於原始點凸包內(含邊上與容許值內), 否則z為null; opt.limitInsideHull為false時凸包外之內插點投影至最近凸包邊並以該邊兩端點線性內插(外推), 詳見interp2NaturalNeighbor;
 * method='kriging'時不受凸包與正方形限制, 凸包外之內插點皆計算(外推)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {Number} [opt.scale=1] 輸入正規化範圍數值，因處理多邊形時有數值容許誤差，故須通過縮放值域來減少問題，預設1是正規化0至1之間，使用scaleXY則是正規化為0至scaleXY之間，預設1
 * @param {String} [opt.method='naturalNeighbor'] 輸入內插方法字串，可選'naturalNeighbor'、'kriging'，預設'naturalNeighbor'；method='kriging'時呼叫interp2Kriging並固定使用其friedrich引擎(經interp2無法選用invall引擎)
 * @param {String} [opt.model='exponential'] 輸入若method='kriging'時之核函數對應模式字串，'gaussian'對應SquaredExp、其餘(含'exponential'、'spherical')對應Exponential，預設'exponential'
 * @param {Number} [opt.ls=0.5] 輸入若method='kriging'時之friedrich核函數lengthscale數值(對應正規化後值域)，預設0.5
 * @param {Number} [opt.noise=0.01] 輸入若method='kriging'時之friedrich觀測噪音標準差(對應正規化後值域)，預設0.01
 * @param {Number} [opt.sigma2=0] (僅舊invall引擎之半變異圖擬合參數，因interp2之kriging固定走friedrich故不生效) 輸入自動擬合參數sigma2數值，預設0
 * @param {Number} [opt.alpha=100] (僅舊invall引擎之半變異圖擬合參數，因interp2之kriging固定走friedrich故不生效) 輸入自動擬合參數alpha數值，預設100
 * @param {Boolean} [opt.returnWithVariogram=false] (僅舊invall引擎參數，因interp2之kriging固定走friedrich故不生效，friedrich無半變異圖) 輸入是否回傳擬合半變異數結果布林值，預設false
 * @param {Boolean} [opt.limitInsideHull=true] 輸入若method='naturalNeighbor'時，是否只內插位於原始點凸包內(含邊界)之內插點布林值，true代表凸包外之內插點z為null，false代表凸包外之內插點投影至最近凸包邊並以該邊兩端點線性內插(屬外推，不受正規化正方形限制)，僅收true與false，其他值視為未給，method='kriging'時無效，預設true
 * @param {Boolean} [opt.useSync=false] 輸入是否使用同步函數布林值，預設false
 * @returns {Promise|Array|Object} 回傳Promise或點物件陣列或點物件，若useSync=false則回傳Promise，resolve為回傳點物件陣列或點物件，reject為失敗訊息，若useSync=true則回傳點物件陣列或點物件，若發生錯誤則回傳錯誤訊息物件
 * @example
 *
 * let ps
 * let p
 * let r
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = await interp2(ps, p)
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486816 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 283,
 *     y: 207,
 * }
 * r = await interp2(ps, p)
 * console.log(r)
 * // => { x: 283, y: 207, z: 114.43040421951918 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 1160,
 *     y: 380,
 * }
 * r = await interp2(ps, p)
 * console.log(r)
 * // => { x: 1160, y: 380, z: null }
 *
 * ps = [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }]
 * p = {
 *     a: 243,
 *     b: 207,
 * }
 * r = await interp2(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
 * console.log(r)
 * // => { a: 243, b: 207, c: 97.29447682486816 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = [
 *     {
 *         x: 243,
 *         y: 207,
 *     },
 *     {
 *         x: 283,
 *         y: 207,
 *     },
 * ]
 * r = await interp2(ps, p)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 207, z: 97.29447682486816 },
 * //   { x: 283, y: 207, z: 114.43040421951918 }
 * // ]
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = await interp2(ps, p, { method: 'kriging' }) //method='kriging'走interp2Kriging, 默認friedrich引擎
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.49846235108123 }
 *
 * ps = [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.000021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.000028, z: 223 }, { x: 0.001092, y: 0.00029, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.000003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }]
 * p = {
 *     x: 0.000243,
 *     y: 0.000207,
 * }
 * r = await interp2(ps, p)
 * console.log(r)
 * // => { x: 0.000243, y: 0.000207, z: 97.29447682486817 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = await interp2(ps, p, { scale: 1000 })
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486816 }
 *
 * //for interp2.wk.umd.js
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = interp2(ps, p, { useSync: true }) //使用interp2.wk.umd.js則不支援sync模式
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486816 }
 *
 */
function interp2(psSrc, psTar, opt = {}) {

    //method
    let method = get(opt, 'method')
    if (method !== 'naturalNeighbor' && method !== 'kriging') {
        method = 'naturalNeighbor'
    }

    //useSync
    let useSync = get(opt, 'useSync')
    if (!isbol(useSync)) {
        useSync = false
    }

    //_sync
    let _sync = () => {
        let r = null
        try {
            if (method === 'naturalNeighbor') {
                r = interp2NaturalNeighbor(psSrc, psTar, opt)
            }
            else if (method === 'kriging') {
                r = interp2Kriging(psSrc, psTar, opt)
            }
        }
        catch (err) {
            r = {
                err: err.toString()
            }
        }
        return r
    }

    //_async
    let _async = async () => {
        let r = null
        try {
            r = _sync()
            let err = get(r, 'err')
            if (isestr(err)) {
                return Promise.reject(err)
            }
            else {
                return r
            }
        }
        catch (err) {
            console.log(err)
            return Promise.reject(err.toString())
        }
    }

    if (useSync) {
        return _sync()
    }
    else {
        return _async()
    }
}


export default interp2

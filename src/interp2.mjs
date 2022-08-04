import get from 'lodash/get'
import interp2NaturalNeighbor from './interp2NaturalNeighbor.mjs'
import interp2Kriging from './interp2Kriging.mjs'


/**
 * 基於不規則網格技術計算指定內插點數值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {Number} [opt.scale=1] 輸入正規化範圍數值，因polybooljs處理多邊形時有數值容許誤差，故須通過縮放值域來減少問題，預設1是正規化0至1之間，使用scaleXY則是正規化為0至scaleXY之間，預設1
 * @param {String} [opt.method='naturalNeighbor'] 輸入內插方法字串，可選'naturalNeighbor'、'kriging'，預設'naturalNeighbor'
 * @param {String} [opt.model='exponential'] 輸入若method='kriging'時之擬合模式字串，可選'exponential'、'gaussian'、'spherical'，預設'exponential'
 * @param {Number} [opt.sigma2=0] 輸入若method='kriging'時之自動擬合參數sigma2數值，預設0
 * @param {Number} [opt.alpha=100] 輸入若method='kriging'時之自動擬合參數alpha數值，預設100
 * @param {Boolean} [opt.returnWithVariogram=false] 輸入若method='kriging'時之是否回傳擬合半變異數結果布林值，預設false
 * @returns {Array|Object} 回傳點物件陣列或點物件
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
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486813 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 283,
 *     y: 207,
 * }
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 283, y: 207, z: 114.43040421951906 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 1160,
 *     y: 380,
 * }
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 1160, y: 380, z: null }
 *
 * ps = [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }]
 * p = {
 *     a: 243,
 *     b: 207,
 * }
 * r = interp2(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
 * console.log(r)
 * // => { a: 243, b: 207, c: 97.29447682486813 }
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
 * r = interp2(ps, p)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 207, z: 97.29447682486813 },
 * //   { x: 283, y: 207, z: 114.43040421951906 }
 * // ]
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = interp2(ps, p, { method: 'kriging' })
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.4283695751981 }
 *
 * ps = [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.00021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.00028, z: 223 }, { x: 0.0001092, y: 0.000290, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.0003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.0001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }]
 * p = {
 *     x: 0.000243,
 *     y: 0.000207,
 * }
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 0.000243, y: 0.000207, z: 97.29447682486834 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = interp2(ps, p, { scale: 1000 })
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486855 }
 *
 */
function interp2(psSrc, psTar, opt = {}) {

    //method
    let method = get(opt, 'method')
    if (method !== 'naturalNeighbor' && method !== 'kriging') {
        method = 'naturalNeighbor'
    }

    let r = null
    if (method === 'naturalNeighbor') {
        r = interp2NaturalNeighbor(psSrc, psTar, opt)
    }
    else if (method === 'kriging') {
        r = interp2Kriging(psSrc, psTar, opt)
    }

    return r
}


export default interp2

import isNumber from 'lodash-es/isNumber.js'
import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'


/**
 * 計算數據內點物件深度
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getPointDepth.test.mjs Github}
 * @memberOf w-gis
 * @param {Object} p 輸入點座標物件
 * @returns {Integer} 回傳深度整數
 * @example
 *
 * let p
 * let r
 *
 * try {
 *     p = [[[[[1, 2.5], [1.1, 2.3]]]]]
 *     r = getPointDepth(p)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => invalid p[[[[[[1,2.5],[1.1,2.3]]]]]]
 *
 * p = [[[[1, 2.5], [1.1, 2.3]]]]
 * r = getPointDepth(p)
 * console.log(r)
 * // => 3
 *
 * p = [[[[1, 2.5]]]]
 * r = getPointDepth(p)
 * console.log(r)
 * // => 3
 *
 * p = [[[1, 2.5]]]
 * r = getPointDepth(p)
 * console.log(r)
 * // => 2
 *
 * p = [[1, 2.5]]
 * r = getPointDepth(p)
 * console.log(r)
 * // => 1
 *
 * try {
 *     p = [{ x: 1, y: 2.5 }]
 *     r = getPointDepth(p)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => invalid p[[{"x":1,"y":2.5}]]
 *
 */
function getPointDepth(p) {
    let v1 = get(p, '0', null)
    let ip1 = size(v1)
    let t1 = isNumber(v1)
    let v2 = get(p, '0.0', null)
    let ip2 = size(v2)
    let t2 = isNumber(v2)
    let v3 = get(p, '0.0.0', null)
    let ip3 = size(v3)
    let t3 = isNumber(v3)
    let v4 = get(p, '0.0.0.0', null)
    // let ip4 = size(v4)
    let t4 = isNumber(v4)
    if (ip3 === 2 && t4) {
        return 3
    }
    if (ip2 === 2 && t3) {
        return 2
    }
    if (ip1 === 2 && t2) {
        return 1
    }
    if (ip1 === 0 && t1) {
        return 0
    }
    // console.log('v1', v1, 'ip1', ip1, 't2', t2)
    // console.log('v2', v2, 'ip2', ip2, 't3', t3)
    // console.log('v3', v3, 'ip3', ip3, 't4', t4)
    throw new Error(`invalid p[${JSON.stringify(p)}]`)
}


export default getPointDepth

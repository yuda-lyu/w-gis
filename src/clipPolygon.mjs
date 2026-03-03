import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'


/**
 * Polygon做差集(clip)，代表 `pgs1 - pgs2`
 *
 * 使用 polybooljs 做平面布林運算，較 turf 在 Polygon 布林計算有較佳穩定性。
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/clipPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs1 輸入被裁切之 RingString、Polygon 或 MultiPolygon 座標陣列
 * @param {Array} pgs2 輸入裁切用之 RingString、Polygon 或 MultiPolygon 座標陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {Number} [opt.epsilon=0.000000000001] 輸入 polybooljs 計算容許誤差
 * @returns {Array|null} 回傳差集後之 Polygon 座標陣列；當 `pgs1` 或 `pgs2` 非陣列時回傳 `null`
 * @example
 *
 * let pgs1
 * let pgs2
 * let r
 *
 * pgs1 = 'not array'
 * pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]
 * try {
 *     r = clipPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => no pgs1
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]
 * pgs2 = 'not array'
 * try {
 *     r = clipPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => invalid pgs2
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]
 * pgs2 = []
 * try {
 *     r = clipPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[4,0],[4,4],[0,4],[0,0]]]
 *
 * pgs1 = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]] // ringString(depth=1)
 * pgs2 = [[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]] // ringString(depth=1)
 * r = clipPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[2,4],[2,0],[0,0],[0,4]]]
 *
 * pgs1 = [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
 * pgs2 = [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]]
 * r = clipPolygon(pgs1, pgs2, { epsilon: 0.00000001 })
 * console.log(JSON.stringify(r))
 * // => [[[2,2],[2,0],[0,0],[0,2]]]
 *
 */
function clipPolygon(pgs1, pgs2, opt = {}) {
    //代表pgs1減去pgs2

    //check pgs1
    if (!isearr(pgs1)) {
        throw new Error(`no pgs1`)
    }

    //check pgs2
    if (isarr(pgs2) && size(pgs2) === 0) {
        return pgs1
    }
    if (!isarr(pgs2)) {
        throw new Error(`invalid pgs2`)
    }

    //epsilon
    let epsilon = get(opt, 'epsilon', 0.000000000001)

    //toPolygon
    pgs1 = toPolygon(pgs1)
    pgs2 = toPolygon(pgs2)

    //difference
    polybooljs.epsilon(epsilon)
    let ints = polybooljs.difference(
        { regions: pgs1 },
        { regions: pgs2 }
    )

    //pgs
    let pgs = get(ints, 'regions', [])

    return pgs
}


export default clipPolygon

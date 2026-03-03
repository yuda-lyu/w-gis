import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


/**
 * MultiPolygon做差集(clip)，代表 `pgs1 - pgs2`
 *
 * 目前採用 turf 的 `difference` 計算，再透過 `distilMultiPolygon` 統一輸出為 MultiPolygon 座標陣列。
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/clipMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs1 輸入被裁切之 RingString、Polygon 或 MultiPolygon 座標陣列
 * @param {Array} pgs2 輸入裁切用之 RingString、Polygon 或 MultiPolygon 座標陣列
 * @param {Object} [opt={}] 輸入設定物件，會傳入 `toMultiPolygon`
 * @param {String} [opt.supposeType='polygons'] 輸入深度為2時之判定模式，可選 `polygons` 或 `ringStrings`
 * @returns {Array|null} 回傳差集後之 MultiPolygon 座標陣列；當 `pgs1` 或 `pgs2` 非陣列時回傳 `null`
 * @example
 *
 * let pgs1
 * let pgs2
 * let r
 *
 * pgs1 = 'not array'
 * pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]]
 * try {
 *     r = clipMultiPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => no pgs1
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
 * pgs2 = 'not array'
 * try {
 *     r = clipMultiPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => invalid pgs2
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
 * pgs2 = []
 * try {
 *     r = clipMultiPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] // polygon(depth=2)
 * pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]] // polygon(depth=2)
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[2,0],[2,4],[0,4],[0,0]]]]
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
 * pgs2 = [[[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]]]
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[4,0],[4,4],[0,4],[0,0]]]]
 *
 */
function clipMultiPolygon(pgs1, pgs2, opt = {}) {
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

    //toMultiPolygon
    pgs1 = toMultiPolygon(pgs1, opt)
    pgs2 = toMultiPolygon(pgs2, opt)

    //multiPolygon
    pgs1 = turf.multiPolygon(pgs1)
    pgs2 = turf.multiPolygon(pgs2)

    //difference
    let r = turf.difference(pgs1, pgs2) //須使用turf 6.5.0版, 7.0.0以上會出現要求最小須2個元素才能計算錯誤, 待turf修正

    return distilMultiPolygon(r)
}


export default clipMultiPolygon

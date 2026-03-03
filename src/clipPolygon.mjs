import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'


/**
 * 針對Polygon進行差集(clip)處理
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/clipPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs1 輸入被裁切之Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]Polygon構成之陣列
 * @param {Array} pgs2 輸入裁切用之Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]Polygon構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {Number} [opt.epsilon=0.000000000001] 輸入 polybooljs 計算容許誤差
 * @returns {Array} 回傳Polygon陣列
 * @example
 *
 * let pgs1
 * let pgs2
 * let r
 *
 * pgs1 = 'not array'
 * pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
 * try {
 *     r = clipPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => no pgs1
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
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
 * pgs1 = [[[0, 0], [1, 0], [1, 1], [0, 1]]] //polygon
 * pgs2 = []
 * r = clipPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[1,0],[1,1],[0,1]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
 * r = clipPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[2,4],[2,0],[0,0],[0,4]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[0, 0], [2, 0], [2, 2], [0, 2]]] //polygon
 * r = clipPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[4,4],[4,0],[2,0],[2,2],[0,2],[0,4]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[0, 0], [2, 2], [0, 4]]] //polygon
 * r = clipPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[4,4],[4,0],[0,0],[2,2],[0,4]]]
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
    // console.log('ints', ints)

    //pgs
    let pgs = get(ints, 'regions', [])

    return pgs
}


export default clipPolygon

import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'
import fixClosePolygon from './fixClosePolygon.mjs'


/**
 * 針對Polygon進行交集(intersect)處理
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/intersectPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs1 輸入第1個Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]構成之陣列
 * @param {Array} pgs2 輸入第2個Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]構成之陣列
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
 *     r = intersectPolygon(pgs1, pgs2, {})
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
 *     r = intersectPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => invalid pgs2
 *
 * pgs1 = [[[0, 0], [1, 0], [1, 1], [0, 1]]] //polygon
 * pgs2 = []
 * r = intersectPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[1,0],[1,1],[0,1],[0,0]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
 * r = intersectPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[4,4],[4,0],[2,0],[2,4],[4,4]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[0, 0], [2, 0], [2, 2], [0, 2]]] //polygon
 * r = intersectPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[2,2],[2,0],[0,0],[0,2],[2,2]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[0, 0], [2, 2], [0, 4]]] //polygon
 * r = intersectPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[2,2],[0,0],[0,4],[2,2]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[-1, 0], [2, 1], [-1, 4]]] //polygon
 * r = intersectPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[2,1],[0,0.3333333333333333],[0,3],[2,1]]]
 *
 */
function intersectPolygon(pgs1, pgs2, opt = {}) {
    //turf的intersect準確性與適用性比較差, 得使用polybooljs比較好

    //check pgs1
    if (!isearr(pgs1)) {
        throw new Error(`no pgs1`)
    }

    //check pgs2
    if (isarr(pgs2) && size(pgs2) === 0) {
        pgs1 = fixClosePolygon(pgs1)
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
    // console.log('pgs1', pgs1)
    // console.log('pgs2', pgs2)

    //intersect
    polybooljs.epsilon(epsilon)
    let ints = polybooljs.intersect(
        { regions: pgs1 },
        { regions: pgs2 }
    )
    // console.log('ints', ints)

    //pgs
    let pgs = get(ints, 'regions', [])

    //fixClosePolygon
    pgs = fixClosePolygon(pgs)

    return pgs
}


export default intersectPolygon

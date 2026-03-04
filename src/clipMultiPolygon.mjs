import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


/**
 * 針對MultiPolygon進行差集(clip)處理，代表pgs1減去pgs2
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/clipMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs1 輸入被裁切之MultiPolygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @param {Array} pgs2 輸入裁切用之MultiPolygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let pgs1
 * let pgs2
 * let r
 *
 * pgs1 = 'not array'
 * pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4]]]] //multiPolygon
 * try {
 *     r = clipMultiPolygon(pgs1, pgs2, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => no pgs1
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
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
 * pgs1 = [[[[0, 0], [1, 0], [1, 1], [0, 1]]]] //multiPolygon
 * pgs2 = []
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[1,0],[1,1],[0,1]]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[2, 0], [4, 0], [4, 4], [2, 4]]] //polygon
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[2,0],[2,4],[0,4],[0,0]]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[0, 0], [2, 0], [2, 2], [0, 2]]] //polygon
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,2],[2,2],[2,0],[4,0],[4,4],[0,4],[0,2]]]]
 *
 * pgs1 = [[[0, 0], [4, 0], [4, 4], [0, 4]]] //polygon
 * pgs2 = [[[0, 0], [2, 2], [0, 4]]] //polygon
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[4,0],[4,4],[0,4],[2,2],[0,0]]]]
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
 * pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4]]]] //multiPolygon
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[2,0],[2,4],[0,4],[0,0]]]]
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
 * pgs2 = [[[[0, 0], [2, 0], [2, 2], [0, 2]]]] //multiPolygon
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,2],[2,2],[2,0],[4,0],[4,4],[0,4],[0,2]]]]
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] //multiPolygon
 * pgs2 = [[[[0, 0], [2, 2], [0, 4]]]] //multiPolygon
 * r = clipMultiPolygon(pgs1, pgs2, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[4,0],[4,4],[0,4],[2,2],[0,0]]]]
 *
 */
function clipMultiPolygon(pgs1, pgs2, opt = {}) {

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

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //toMultiPolygon
    pgs1 = toMultiPolygon(pgs1, { supposeType })
    pgs2 = toMultiPolygon(pgs2, { supposeType })

    //multiPolygon
    pgs1 = turf.multiPolygon(pgs1)
    pgs2 = turf.multiPolygon(pgs2)

    //difference
    let r = turf.difference(pgs1, pgs2) //須使用turf 6.5.0版, 7.0.0以上會出現要求最小須2個元素才能計算錯誤, 待turf修正

    return distilMultiPolygon(r)
}


export default clipMultiPolygon

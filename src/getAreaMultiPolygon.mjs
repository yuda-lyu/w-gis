import each from 'lodash-es/each.js'
import isearr from 'wsemi/src/isearr.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import getAreaPolygon from './getAreaPolygon.mjs'


/**
 * 計算MultiPolygon面積
 * 得要考慮多區域、剔除區域之組合: http://esri.github.io/geometry-api-java/doc/Polygon.html
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getAreaMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]Polygon構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Number} 回傳面積數字
 * @example
 *
 * let pgs
 * let r
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 *     [0, 0], //閉合
 * ]
 * r = getAreaMultiPolygon(pgs)
 * console.log(r)
 * // => 100
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getAreaMultiPolygon(pgs)
 * console.log(r)
 * // => 100
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaMultiPolygon(pgs)
 * console.log(r)
 * // => 100
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaMultiPolygon(pgs)
 * console.log(r)
 * // => 10
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ],
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons故面積直接加總
 * console.log(r)
 * // => 110
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ],
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaMultiPolygon(pgs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings
 * console.log(r)
 * // => 90
 *
 * pgs = [ //multiPolygon
 *     [
 *         [
 *             [0, 0],
 *             [100, 0],
 *             [100, 1],
 *             [0, 1],
 *         ],
 *         [
 *             [0, 0],
 *             [10, 0],
 *             [10, 1],
 *             [0, 1],
 *         ]
 *     ]
 * ]
 * r = getAreaMultiPolygon(pgs)
 * console.log(r)
 * // => 90
 *
 */
function getAreaMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)
    // console.log('pgs', pgs)

    let r = 0
    each(pgs, (v) => {
        r += getAreaPolygon(v)
    })

    return r
}


export default getAreaMultiPolygon

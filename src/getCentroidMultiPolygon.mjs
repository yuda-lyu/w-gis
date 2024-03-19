import get from 'lodash-es/get'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import fixCloseMultiPolygon from './fixCloseMultiPolygon.mjs'


/**
 * 計算MultiPolygon形心座標
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getCentroidMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]Polygon構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Array} 回傳形心座標陣列
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
 * r = getCentroidMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [50,0.5]
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getCentroidMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [50,0.5]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getCentroidMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [50,0.5]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getCentroidMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [5,0.5]
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
 * r = getCentroidMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
 * console.log(JSON.stringify(r))
 * // => [27.5,0.5] //非2個ringString共構的polygon形心
 * console.log('(50*10+5*1)/11', (50 * 10 + 5 * 1) / 11)
 * // => (50*10+5*1)/11 45.90909090909091
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
 * r = getCentroidMultiPolygon(pgs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [27.5,0.5] //非第1個ringString剔除第2個ringString的形心
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
 * r = getCentroidMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [27.5,0.5] //非第1個ringString剔除第2個ringString的形心
 *
 */
function getCentroidMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    // psg = toMultiPolygon(pgs) //fixCloseMultiPolygon裡面已有toMultiPolygon故不用另外呼叫處理

    //fixCloseMultiPolygon, 因turf的centroid會受RingString未閉合影響得修正成為閉合
    pgs = fixCloseMultiPolygon(pgs, opt)

    //multiPolygon
    pgs = turf.helpers.multiPolygon(pgs)

    //centroid
    let r = turf.centroid(pgs)

    //pt
    let pt = get(r, 'geometry.coordinates', [])

    return pt
}


export default getCentroidMultiPolygon

import get from 'lodash-es/get.js'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


/**
 * 計算MultiPolygon質心座標
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getCenterOfMassMultiPolygon.test.mjs Github}
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
 * r = getCenterOfMassMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [50,0.5]
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getCenterOfMassMultiPolygon(pgs)
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
 * r = getCenterOfMassMultiPolygon(pgs)
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
 * r = getCenterOfMassMultiPolygon(pgs)
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
 * r = getCenterOfMassMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
 * console.log(JSON.stringify(r))
 * // => [50,0.5] //非2個ringString共構的polygon質心, 僅計算第1個
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
 * r = getCenterOfMassMultiPolygon(pgs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [50,0.5] //非第1個ringString剔除第2個ringString的質心, 僅計算第1個
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
 * r = getCenterOfMassMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [50,0.5] //非第1個ringString剔除第2個ringString的質心, 僅計算第1個
 *
 */
function getCenterOfMassMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)

    //multiPolygon
    pgs = turf.helpers.multiPolygon(pgs)

    //centerOfMass
    let r = turf.centerOfMass(pgs)

    //pt
    let pt = get(r, 'geometry.coordinates', [])

    return pt
}


export default getCenterOfMassMultiPolygon

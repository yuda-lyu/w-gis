import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


/**
 * 計算MultiPolygon面積，輸入各點為經緯度座標，輸出為平方公尺面積
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getAreaMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]Polygon構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Number} 回傳面積數字，單位為m2
 * @example
 *
 * let pgs
 * let r
 *
 * pgs = [ //ringString
 *     [121, 23],
 *     [122, 23],
 *     [122, 24],
 *     [121, 24],
 *     [121, 23], //閉合
 * ]
 * r = getAreaMultiPolygonSm(pgs)
 * console.log(r)
 * // => 11364090825.686134
 *
 * pgs = [ //ringString
 *     [121, 23],
 *     [122, 23],
 *     [122, 24],
 *     [121, 24],
 * ]
 * r = getAreaMultiPolygonSm(pgs)
 * console.log(r)
 * // => 11364090825.686134
 *
 * pgs = [ //polygon
 *     [
 *         [121, 23],
 *         [122, 23],
 *         [122, 24],
 *         [121, 24],
 *     ]
 * ]
 * r = getAreaMultiPolygonSm(pgs)
 * console.log(r)
 * // => 11364090825.686134
 *
 * pgs = [ //polygon
 *     [
 *         [121, 23],
 *         [121.5, 23],
 *         [121.5, 24],
 *         [121, 24],
 *     ]
 * ]
 * r = getAreaMultiPolygonSm(pgs)
 * console.log(r)
 * // => 5682045412.843067
 *
 * pgs = [ //polygon
 *     [
 *         [121, 23],
 *         [122, 23],
 *         [122, 24],
 *         [121, 24],
 *     ],
 *     [
 *         [121, 23],
 *         [121.5, 23],
 *         [121.5, 24],
 *         [121, 24],
 *     ]
 * ]
 * r = getAreaMultiPolygonSm(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons故面積直接加總
 * console.log(r)
 * // => 17046136238.529202
 *
 * pgs = [ //polygon
 *     [
 *         [121, 23],
 *         [122, 23],
 *         [122, 24],
 *         [121, 24],
 *     ],
 *     [
 *         [121, 23],
 *         [121.5, 23],
 *         [121.5, 24],
 *         [121, 24],
 *     ]
 * ]
 * r = getAreaMultiPolygonSm(pgs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings, 但turf計算時只取最後ringString計算面積
 * console.log(r)
 * // => 5682045412.843067
 *
 * pgs = [ //multiPolygon
 *     [
 *         [
 *             [121, 23],
 *             [122, 23],
 *             [122, 24],
 *             [121, 24],
 *         ],
 *         [
 *             [121, 23],
 *             [121.5, 23],
 *             [121.5, 24],
 *             [121, 24],
 *         ]
 *     ]
 * ]
 * r = getAreaMultiPolygonSm(pgs) //turf計算時只取最後ringString計算面積
 * console.log(r)
 * // => 5682045412.843067
 *
 */
function getAreaMultiPolygonSm(pgs, opt = {}) {
    //傳入MultiPolygon(經緯度)計算面積(m2)

    //check
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)
    // console.log('pgs[0]', pgs[0])

    //multiPolygon
    pgs = turf.multiPolygon(pgs)
    // console.log('pgs', pgs.geometry.type, pgs.geometry.coordinates) //JSON.stringify(pgs.geometry.coordinates, null, 2)
    // console.log('pgs.geometry.coordinates[0]', pgs.geometry.coordinates[0])

    //area
    let r = turf.area(pgs)

    return r
}


export default getAreaMultiPolygonSm

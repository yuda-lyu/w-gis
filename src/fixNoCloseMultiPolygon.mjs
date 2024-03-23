import map from 'lodash-es/map.js'
import size from 'lodash-es/size.js'
import isEqual from 'lodash-es/isEqual.js'
import dropRight from 'lodash-es/dropRight.js'
import isearr from 'wsemi/src/isearr.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


/**
 * 修復MultiPolygon內各RingString為非閉合
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/fixNoCloseMultiPolygon.test.mjs Github}
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
 * r = fixNoCloseMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]]]
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = fixNoCloseMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = fixNoCloseMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = fixNoCloseMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[10,0],[10,1],[0,1]]]]
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
 * r = fixNoCloseMultiPolygon(pgs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]],[[[0,0],[10,0],[10,1],[0,1]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *         [0, 0],
 *     ],
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = fixNoCloseMultiPolygon(pgs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]]
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
 *             [0, 0],
 *         ]
 *     ]
 * ]
 * r = fixNoCloseMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]]
 *
 */
function fixNoCloseMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)

    //修復成為閉合, turf的centroid得要輸入閉合RingString
    pgs = map(pgs, (pg) => {
        pg = map(pg, (rs) => {
            let i0 = 0
            let i1 = size(rs) - 1
            let rs0 = rs[i0]
            let rs1 = rs[i1]
            if (isEqual(rs0, rs1)) {
                rs = dropRight(rs)
            }
            return rs
        })
        return pg
    })

    return pgs
}


export default fixNoCloseMultiPolygon

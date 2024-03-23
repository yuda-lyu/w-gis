import get from 'lodash-es/get.js'
import map from 'lodash-es/map.js'
import getPointDepth from './getPointDepth.mjs'


/**
 * 轉換RingString、polygon、MultiPolygon成為MultiPolygon
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/toMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} v 輸入資料陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let rs
 * let r
 *
 * rs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 *     [0, 0], //閉合
 * ]
 * r = toMultiPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1],[0,0]]]]
 *
 * rs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = toMultiPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]]]
 *
 * rs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = toMultiPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]]]
 *
 * rs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = toMultiPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[10,0],[10,1],[0,1]]]]
 *
 * rs = [ //polygon
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
 * r = toMultiPolygon(rs) //預設polygon轉multiPolygon使用視為polygons, 故其內會是2個polygons
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]]],[[[0,0],[10,0],[10,1],[0,1]]]]
 *
 * rs = [ //polygon
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
 * r = toMultiPolygon(rs, { supposeType: 'ringStrings' }) //polygon轉multiPolygon使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]]
 *
 * rs = [ //multiPolygon
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
 * r = toMultiPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]]
 *
 */
function toMultiPolygon(v, opt = {}) {

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //d
    let d = getPointDepth(v)
    // console.log('supposeType', supposeType, 'dp', d)
    if (d === 3) {
        return v
    }
    else if (d === 2) {
        if (supposeType === 'polygons') {
            return map(v, (vv) => {
                return [vv] //預設輸入為polygon的陣列, 故採用此法, 但若是polygon的多ringString(外包內剔除), 就會有問題
            })
        }
        else {
            return [v]
        }
    }
    else if (d === 1) {
        return [[v]]
    }
    else if (d === 0) {
        return []
    }
    return v
}


export default toMultiPolygon

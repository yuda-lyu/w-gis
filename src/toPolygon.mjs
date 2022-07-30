import flatten from 'lodash/flatten'
import getPointDepth from './getPointDepth.mjs'


/**
 * 轉換RingString、polygon、MultiPolygon成為Polygon
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/toPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} v 輸入資料陣列
 * @returns {Array} 回傳資料陣列
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
 * r = toPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[100,0],[100,1],[0,1],[0,0]]]
 *
 * rs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = toPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[100,0],[100,1],[0,1]]]
 *
 * rs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = toPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[100,0],[100,1],[0,1]]]
 *
 * rs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = toPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[10,0],[10,1],[0,1]]]
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
 * r = toPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]
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
 * r = toPolygon(rs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0],[100,0],[100,1],[0,1]],[[0,0],[10,0],[10,1],[0,1]]]
 *
 */
function toPolygon(v) {
    let d = getPointDepth(v)
    if (d === 3) {
        return flatten(v)
    }
    if (d === 2) {
        return v
    }
    if (d === 1) {
        return [v]
    }
    if (d === 0) {
        return []
    }
    return v
}


export default toPolygon

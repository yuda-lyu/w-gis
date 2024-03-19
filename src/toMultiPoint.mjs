import flatten from 'lodash-es/flatten'
import turf from './importTurf.mjs'
import getPointDepth from './getPointDepth.mjs'


/**
 * 轉換點陣列成為MultiPoint
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/toMultiPoint.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} v 輸入點陣列
 * @returns {Array} 回傳資料陣列
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
 * r = toMultiPoint(pgs)
 * console.log(JSON.stringify(r))
 * // => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1],[0,0]]}}
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = toMultiPoint(pgs)
 * console.log(JSON.stringify(r))
 * // => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1]]}}
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = toMultiPoint(pgs)
 * console.log(JSON.stringify(r))
 * // => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1]]}}
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = toMultiPoint(pgs)
 * console.log(JSON.stringify(r))
 * // => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[10,0],[10,1],[0,1]]}}
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
 * r = toMultiPoint(pgs)
 * console.log(JSON.stringify(r))
 * // => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1],[0,0],[10,0],[10,1],[0,1]]}}
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
 * r = toMultiPoint(pgs)
 * console.log(JSON.stringify(r))
 * // => {"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[0,0],[100,0],[100,1],[0,1],[0,0],[10,0],[10,1],[0,1]]}}
 *
 */
function toMultiPoint(v) {

    //d
    let d = getPointDepth(v)
    // console.log('getPointDepth', d)

    if (d === 3) {
        v = flatten(flatten(v))
    }
    else if (d === 2) {
        v = flatten(v)
    }
    else if (d === 1) {
        // v = v
    }
    else if (d === 0) {
        v = []
    }

    //multiPoint
    let pts = turf.multiPoint(v)

    return pts
}


export default toMultiPoint

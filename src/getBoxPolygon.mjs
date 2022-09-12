import turf from './importTurf.mjs'
import toMultiPoint from './toMultiPoint.mjs'


/**
 * 計算點、線、面陣列之外接矩形
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getBoxPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} fts 輸入資料陣列，為多點(multiPoint)、線(line)、多線(multiLine)、面(polygon)、多面(multiPolygon)數據陣列
 * @returns {Number} 回傳外接矩形陣列，陣列為4元素分別為[minX, minY, maxX, maxY]
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
 * r = getBoxPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [0,0,100,1]
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getBoxPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [0,0,100,1]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getBoxPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [0,0,100,1]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getBoxPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [0,0,10,1]
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
 * r = getBoxPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [0,0,100,1]
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
 * r = getBoxPolygon(pgs, { supposeType: 'ringStrings' })
 * console.log(JSON.stringify(r))
 * // => [0,0,100,1]
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
 *         ],
 *         [
 *             [0, 0],
 *             [-10, 0],
 *             [-10, 123],
 *             [0, 1],
 *         ]
 *     ]
 * ]
 * r = getBoxPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [-10,0,100,123]
 *
 */
function getBoxPolygon(fts) {

    //toMultiPoint
    let pts = toMultiPoint(fts)
    // console.log('multiPoint', JSON.stringify(pts))

    //bbox, [minX, minY, maxX, maxY]
    let bbox = turf.bbox(pts)
    // console.log('bbox', bbox)

    // let r = turf.bboxPolygon(bbox)
    // console.log('bboxPolygon', r)

    return bbox
}


export default getBoxPolygon

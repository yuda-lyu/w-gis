import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPoint from './toMultiPoint.mjs'


/**
 * 計算點、線、面陣列之外接矩形範圍
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getBox.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} fts 輸入資料陣列，為多點(multiPoint)、線(line)、多線(multiLine)、面(polygon)、多面(multiPolygon)數據陣列
 * @returns {Object} 回傳外接矩形範圍物件
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
 * r = getBox(pgs)
 * console.log(JSON.stringify(r))
 * // => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getBox(pgs)
 * console.log(JSON.stringify(r))
 * // => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getBox(pgs)
 * console.log(JSON.stringify(r))
 * // => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getBox(pgs)
 * console.log(JSON.stringify(r))
 * // => {"xmin":0,"ymin":0,"xmax":10,"ymax":1}
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
 * r = getBox(pgs)
 * console.log(JSON.stringify(r))
 * // => {"xmin":0,"ymin":0,"xmax":100,"ymax":1}
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
 * r = getBox(pgs)
 * console.log(JSON.stringify(r))
 * // => {"xmin":-10,"ymin":0,"xmax":100,"ymax":123}
 *
 */
function getBox(fts) {

    //check
    if (!isearr(fts)) {
        throw new Error(`fts is not an effective array`)
    }

    //toMultiPoint
    let pts = toMultiPoint(fts)
    // console.log('multiPoint', JSON.stringify(pts))

    //bx, [minX, minY, maxX, maxY]
    let bx = turf.bbox(pts)
    // console.log('bx', bx)

    //minX, minY, maxX, maxY
    let xmin = bx[0]
    let ymin = bx[1]
    let xmax = bx[2]
    let ymax = bx[3]

    return {
        xmin,
        ymin,
        xmax,
        ymax,
    }
}


export default getBox

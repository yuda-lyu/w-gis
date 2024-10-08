import getBox from './getBox.mjs'


/**
 * 計算點、線、面陣列之外接矩形並轉出polygon陣列
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getBoxPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} fts 輸入資料陣列，為多點(multiPoint)、線(line)、多線(multiLine)、面(polygon)、多面(multiPolygon)數據陣列
 * @returns {Array} 回傳polygon陣列
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
 * console.log(r)
 * // => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getBoxPolygon(pgs)
 * console.log(r)
 * // => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]
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
 * console.log(r)
 * // => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]
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
 * console.log(r)
 * // => [ [ 0, 0 ], [ 10, 0 ], [ 10, 1 ], [ 0, 1 ], [ 0, 0 ] ]
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
 * console.log(r)
 * // => [ [ 0, 0 ], [ 100, 0 ], [ 100, 1 ], [ 0, 1 ], [ 0, 0 ] ]
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
 * console.log(r)
 * // => [ [ -10, 0 ], [ 100, 0 ], [ 100, 123 ], [ -10, 123 ], [ -10, 0 ] ]
 *
 */
function getBoxPolygon(fts) {

    //bx
    let bx = getBox(fts)

    //xmin, ymin, xmax, ymax
    let xmin = bx.xmin
    let ymin = bx.ymin
    let xmax = bx.xmax
    let ymax = bx.ymax

    //pg
    let pg = [
        [xmin, ymin],
        [xmax, ymin],
        [xmax, ymax],
        [xmin, ymax],
        [xmin, ymin],
    ]

    return pg
}


export default getBoxPolygon

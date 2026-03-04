import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'


/**
 * 萃取為MultiPolygon座標陣列
 *
 * 因turf計算後可能產生多種幾何類型，例如Polygon、MultiPolygon、LineString、GeometryCollection等，故將全部轉成MultiPolygon後回傳
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/distilMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Object} r 輸入turf幾何運算回傳之Feature物件
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let data
 * let r
 *
 * data = null
 * r = distilMultiPolygon(data)
 * console.log(r)
 * // => []
 *
 * data = {
 *     geometry: {
 *         type: 'Polygon',
 *         coordinates: [
 *             [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
 *         ],
 *     },
 * }
 * r = distilMultiPolygon(data)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[1,0],[1,1],[0,1],[0,0]]]]
 *
 * data = {
 *     geometry: {
 *         type: 'MultiPolygon',
 *         coordinates: [
 *             [
 *                 [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
 *             ],
 *             [
 *                 [[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]],
 *             ],
 *         ],
 *     },
 * }
 * r = distilMultiPolygon(data)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[1,0],[1,1],[0,1],[0,0]]],[[[2,0],[3,0],[3,1],[2,1],[2,0]]]]
 *
 * data = {
 *     geometry: {
 *         type: 'GeometryCollection',
 *         geometries: [
 *             { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
 *             { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] },
 *             { type: 'MultiPolygon', coordinates: [[[[10, 0], [11, 0], [11, 1], [10, 1], [10, 0]]]] },
 *         ],
 *     },
 * }
 * r = distilMultiPolygon(data)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[2,0],[2,2],[0,2],[0,0]]],[[[10,0],[11,0],[11,1],[10,1],[10,0]]]]
 *
 * data = {
 *     geometry: {
 *         type: 'LineString',
 *         coordinates: [[0, 0], [1, 1]],
 *     },
 * }
 * r = distilMultiPolygon(data)
 * console.log(r)
 * // => []
 *
 */
function distilMultiPolygon(r) {

    let parseGeometryCollection = (data) => {

        //gs
        let gs = get(data, 'geometry.geometries', [])

        //pgs
        let pgs = []
        each(gs, (v) => {
            if (v.type === 'Polygon') {
                pgs.push(v.coordinates)
            }
            else if (v.type === 'MultiPolygon') {
                each(v.coordinates, (vv) => {
                    pgs.push(vv)
                })
            }
        })

        return pgs
    }

    //type
    let type = get(r, 'geometry.type', '')

    //pgNew
    let pgNew = get(r, 'geometry.coordinates', [])

    if (type === 'Polygon') {
        return [pgNew]
    }
    else if (type === 'MultiPolygon') {
        return pgNew
    }
    else if (type === 'GeometryCollection') {
        return parseGeometryCollection(r)
    }
    else {
        // console.log('type', type, r)
        return []
    }
}


export default distilMultiPolygon

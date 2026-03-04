import isearr from 'wsemi/src/isearr.mjs'
import map from 'lodash-es/map.js'
import getPointDepth from './getPointDepth.mjs'
import invCoordPolygonOrPolyline from './invCoordPolygonOrPolyline.mjs'


/**
 * 針對MultiPolygon進行(x,y)座標交換，因為turf的point是先經再緯，於GeoJSON也是，但跟leaflet相反，故需交換座標
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/invCoordMultiPolygonOrMultiPolyline.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入MultiPolygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let pgs
 * let r
 *
 * pgs = [[[ //multiPolygon
 *     [0.1, 0],
 *     [5.2, 1],
 *     [3.7, 2],
 *     [0.6, 3],
 * ]]]
 * r = invCoordMultiPolygonOrMultiPolyline(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0.1],[1,5.2],[2,3.7],[3,0.6]]]]
 *
 * try {
 *     pgs = [[ //polygon
 *         [0.1, 0],
 *         [5.2, 1],
 *         [3.7, 2],
 *         [0.6, 3],
 *     ]]
 *     r = invCoordMultiPolygonOrMultiPolyline(pgs)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(JSON.stringify(r))
 * // => "invalid point depth[2]!=3"
 *
 * try {
 *     pgs = [ //ringString
 *         [0.1, 0],
 *         [5.2, 1],
 *         [3.7, 2],
 *         [0.6, 3],
 *     ]
 *     r = invCoordMultiPolygonOrMultiPolyline(pgs)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(JSON.stringify(r))
 * // => "invalid point depth[1]!=3"
 *
 */
function invCoordMultiPolygonOrMultiPolyline(pgs) {

    //check
    if (!isearr(pgs)) {
        throw new Error(`no pgs`)
    }

    //d
    let d = getPointDepth(pgs)
    // console.log('getPointDepth', d)

    //check
    if (d !== 3) {
        throw new Error(`invalid point depth[${d}]!=3`)
    }

    //invCoordPolygonOrPolyline
    let r = map(pgs, (pg) => {
        return invCoordPolygonOrPolyline(pg)
    })

    return r
}


export default invCoordMultiPolygonOrMultiPolyline

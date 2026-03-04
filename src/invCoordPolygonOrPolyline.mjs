import map from 'lodash-es/map.js'
import isearr from 'wsemi/src/isearr.mjs'
import getPointDepth from './getPointDepth.mjs'


/**
 * 針對Polygon進行(x,y)座標交換，主要因為turf的point是先經再緯，於GeoJSON也是，但跟leaflet相反，故需交換座標
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/invCoordPolygonOrPolyline.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]構成之陣列
 * @returns {Array} 回傳Polygon陣列
 * @example
 *
 * let pgs
 * let r
 *
 * try {
 *     pgs = [[[ //multiPolygon
 *         [0.1, 0],
 *         [5.2, 1],
 *         [3.7, 2],
 *         [0.6, 3],
 *     ]]]
 *     r = invCoordPolygonOrPolyline(pgs)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(JSON.stringify(r))
 * // => "invalid point depth[3]!=2"
 *
 * pgs = [[ //polygon
 *     [0.1, 0],
 *     [5.2, 1],
 *     [3.7, 2],
 *     [0.6, 3],
 * ]]
 * r = invCoordPolygonOrPolyline(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[0,0.1],[1,5.2],[2,3.7],[3,0.6]]]
 *
 * try {
 *     pgs = [ //ringString
 *         [0.1, 0],
 *         [5.2, 1],
 *         [3.7, 2],
 *         [0.6, 3],
 *     ]
 *     r = invCoordPolygonOrPolyline(pgs)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(JSON.stringify(r))
 * // => "invalid point depth[1]!=2"
 *
 */
function invCoordPolygonOrPolyline(pg) {
    //因為turf的point是先經再緯, GeoJSON也是, 但跟leaflet相反, 故需相反座標

    //check
    if (!isearr(pg)) {
        throw new Error(`no pg`)
    }

    //d
    let d = getPointDepth(pg)
    // console.log('getPointDepth', d)

    //check
    if (d !== 2) {
        throw new Error(`invalid point depth[${d}]!=2`)
    }

    //交換順序
    let r = map(pg, (v) => {
        return map(v, (vv) => {
            return [vv[1], vv[0]] //一定需為長度2陣列之數據
        })
    })

    return r
}


export default invCoordPolygonOrPolyline

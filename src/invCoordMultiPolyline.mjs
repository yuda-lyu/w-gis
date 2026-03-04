import invCoordMultiPolygonOrMultiPolyline from './invCoordMultiPolygonOrMultiPolyline.mjs'


/**
 * 針對MultiPolyline進行(x,y)座標交換
 *
 * @memberOf w-gis
 * @param {Array} pgs 輸入MultiPolyline資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @returns {Array} 回傳MultiPolyline陣列
 * @example
 *
 * 詳見invCoordMultiPolygonOrMultiPolyline
 *
 */
function invCoordMultiPolyline(pgs) {
    return invCoordMultiPolygonOrMultiPolyline(pgs)
}


export default invCoordMultiPolyline

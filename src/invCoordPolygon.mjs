import invCoordPolygonOrPolyline from './invCoordPolygonOrPolyline.mjs'


/**
 * 針對Polygon進行(x,y)座標交換，主要因為turf的point是先經再緯，於GeoJSON也是，但跟leaflet相反，故需交換座標
 *
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]構成之陣列
 * @returns {Array} 回傳Polygon陣列
 * @example
 *
 * 詳見invCoordPolygonOrPolyline
 *
 */
function invCoordPolygon(pg) {
    return invCoordPolygonOrPolyline(pg)
}


export default invCoordPolygon

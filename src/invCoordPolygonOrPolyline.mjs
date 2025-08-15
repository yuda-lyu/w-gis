import isearr from 'wsemi/src/isearr.mjs'
import map from 'lodash-es/map.js'


function invCoordPolygonOrPolyline(pg) {
    //因為turf的point是先經再緯, GeoJSON也是, 但跟leaflet相反, 故需相反座標

    //check
    if (!isearr(pg)) {
        return null
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

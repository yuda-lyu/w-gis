import isearr from 'wsemi/src/isearr.mjs'
import map from 'lodash-es/map.js'
import invCoordPolygonOrPolyline from './invCoordPolygonOrPolyline.mjs'


function invCoordMultiPolygonOrMultiPolyline(pgs) {
    //因為turf的point是先經再緯, GeoJSON也是, 但跟leaflet相反, 故需相反座標

    //check
    if (!isearr(pgs)) {
        return null
    }

    //invCoordPolygonOrPolyline
    let r = map(pgs, (pg) => {
        return invCoordPolygonOrPolyline(pg)
    })

    return r
}


export default invCoordMultiPolygonOrMultiPolyline

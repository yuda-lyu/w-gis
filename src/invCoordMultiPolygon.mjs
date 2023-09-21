import isearr from 'wsemi/src/isearr.mjs'
import map from 'lodash/map'
import invCoordPolygon from './invCoordPolygon.mjs'


function invCoordMultiPolygon(pgs) {
    //因為turf的point是先經再緯, GeoJSON也是, 但跟leaflet相反, 故需相反座標

    //check
    if (!isearr(pgs)) {
        return null
    }

    //invCoordPolygon
    let r = map(pgs, (pg) => {
        return invCoordPolygon(pg)
    })

    return r
}


export default invCoordMultiPolygon

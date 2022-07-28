import isearr from 'wsemi/src/isearr.mjs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function isPointInPolygon(p, pgs) {

    //check
    if (!isearr(p)) {
        return null
    }
    if (!isearr(pgs)) {
        return null
    }

    let r = turf.booleanPointInPolygon(p, turf.helpers.multiPolygon(toMultiPolygon(pgs)))
    return r
}


export default isPointInPolygon

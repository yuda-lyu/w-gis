import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function isPointInPolygon(p, pgs, opt = {}) {

    //check
    if (!isearr(p)) {
        return null
    }
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)

    //multiPolygon
    pgs = turf.helpers.multiPolygon(pgs)

    //booleanPointInPolygon
    let r = turf.booleanPointInPolygon(p, pgs)

    return r
}


export default isPointInPolygon

import get from 'lodash/get'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function getCentroidMultiPolygon(pgs) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //centroid
    let r = turf.centroid(turf.helpers.multiPolygon(toMultiPolygon(pgs)))

    //pt
    let pt = get(r, 'geometry.coordinates', [])

    return pt
}


export default getCentroidMultiPolygon

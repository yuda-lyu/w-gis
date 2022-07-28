import get from 'lodash/get'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function getCenterOfMassMultiPolygon(pgs) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //centerOfMass
    let r = turf.centerOfMass(turf.helpers.multiPolygon(toMultiPolygon(pgs)))

    //pt
    let pt = get(r, 'geometry.coordinates', [])

    return pt
}


export default getCenterOfMassMultiPolygon

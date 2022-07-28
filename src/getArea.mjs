import isearr from 'wsemi/src/isearr.mjs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function getArea(pgs) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //area
    let r = turf.area(turf.helpers.multiPolygon(toMultiPolygon(pgs)))

    return r
}


export default getArea

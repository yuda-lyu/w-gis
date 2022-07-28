import get from 'lodash/get'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'


function intersectPolygon_polybooljs(pgs1, pgs2) {

    //check
    if (!isearr(pgs1)) {
        return null
    }
    if (!isearr(pgs2)) {
        return null
    }

    //toPolygon
    pgs1 = toPolygon(pgs1)
    pgs2 = toPolygon(pgs2)

    //intersect
    let ints = polybooljs.intersect(
        { regions: pgs1 },
        { regions: pgs2 }
    )

    //pgs
    let pgs = get(ints, 'regions', [])

    return pgs
}


function intersectPolygon(pgs1, pgs2) {
    return intersectPolygon_polybooljs(pgs1, pgs2)
}


export default intersectPolygon

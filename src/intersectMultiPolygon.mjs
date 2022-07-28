import isearr from 'wsemi/src/isearr.mjs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function intersectMultiPolygon(pgs, pgsInter) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //pgNew
    let r = turf.intersect(turf.helpers.multiPolygon(toMultiPolygon(pgs)), turf.helpers.multiPolygon(toMultiPolygon(pgsInter)))

    return distilMultiPolygon(r)
}


export default intersectMultiPolygon

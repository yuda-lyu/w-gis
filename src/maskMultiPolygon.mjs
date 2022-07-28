import isearr from 'wsemi/src/isearr.mjs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function maskMultiPolygon(pgs) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //pgNew
    let r = turf.mask(turf.helpers.multiPolygon(toMultiPolygon(pgs)))

    return distilMultiPolygon(r)
}


export default maskMultiPolygon

import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function maskMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)

    //multiPolygon
    pgs = turf.multiPolygon(pgs)

    //mask
    let r = turf.mask(pgs)

    return distilMultiPolygon(r)
}


export default maskMultiPolygon

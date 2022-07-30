import get from 'lodash/get'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function simplifyMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //tolerance
    let tolerance = get(opt, 'tolerance')
    if (!isnum(tolerance)) {
        tolerance = 0.005
    }
    tolerance = cdbl(tolerance)

    //highQuality
    let highQuality = get(opt, 'highQuality')
    if (!isbol(highQuality)) {
        highQuality = true
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)

    //multiPolygon
    pgs = turf.helpers.multiPolygon(pgs)

    //simplify
    let r = turf.simplify(pgs, { tolerance, highQuality })

    //get pgs
    r = get(r, 'geometry.coordinates', [])
    // console.log('r',r)

    return r
}


export default simplifyMultiPolygon

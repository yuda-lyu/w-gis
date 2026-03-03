import get from 'lodash-es/get.js'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


function simplifyMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        throw new Error(`no pgs`)
    }

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
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
    pgs = toMultiPolygon(pgs, { supposeType })

    //multiPolygon
    pgs = turf.multiPolygon(pgs)

    //simplify
    let r = turf.simplify(pgs, { tolerance, highQuality })

    //get pgs
    r = get(r, 'geometry.coordinates', [])
    // console.log('r',r)

    return r
}


export default simplifyMultiPolygon

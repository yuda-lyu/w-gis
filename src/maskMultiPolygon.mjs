import get from 'lodash-es/get.js'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function maskMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        throw new Error(`no pgs`)
    }

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, { supposeType })

    //multiPolygon
    pgs = turf.multiPolygon(pgs)

    //mask
    let r = turf.mask(pgs)

    return distilMultiPolygon(r)
}


export default maskMultiPolygon

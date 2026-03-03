import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
// import unionPolygon from './unionPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function unionMultiPolygon(pgs1, pgs2, opt = {}) {
    //turf版本可能問題較多, 待測試改用polybooljs.union

    //check pgs1
    if (!isearr(pgs1)) {
        throw new Error(`no pgs1`)
    }

    //check pgs2
    if (isarr(pgs2) && size(pgs2) === 0) {
        return pgs1
    }
    if (!isarr(pgs2)) {
        throw new Error(`invalid pgs2`)
    }

    //toMultiPolygon
    pgs1 = toMultiPolygon(pgs1, opt)
    pgs2 = toMultiPolygon(pgs2, opt)

    //multiPolygon
    pgs1 = turf.multiPolygon(pgs1)
    pgs2 = turf.multiPolygon(pgs2)

    //union
    let r = turf.union(pgs1, pgs2)

    return distilMultiPolygon(r)
}


export default unionMultiPolygon

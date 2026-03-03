import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'


function intersectPolygon(pgs1, pgs2, opt = {}) {
    //turf的intersect準確性與適用性比較差, 得使用polybooljs比較好

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

    //epsilon
    let epsilon = get(opt, 'epsilon', 0.000000000001)

    //toPolygon
    pgs1 = toPolygon(pgs1)
    pgs2 = toPolygon(pgs2)

    //intersect
    polybooljs.epsilon(epsilon)
    let ints = polybooljs.intersect(
        { regions: pgs1 },
        { regions: pgs2 }
    )

    //pgs
    let pgs = get(ints, 'regions', [])

    return pgs
}


export default intersectPolygon

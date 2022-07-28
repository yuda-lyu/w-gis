import get from 'lodash/get'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'


function clipPolygon(pgs1, pgs2) {
    //代表pgs1減去pgs2
    //turf的difference準確性與適用性比較差, 得使用polybooljs比較好

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

    //difference
    let ints = polybooljs.difference(
        { regions: pgs1 },
        { regions: pgs2 }
    )

    //pgs
    let pgs = get(ints, 'regions', [])

    return pgs
}


export default clipPolygon

import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
// import intersectPolygon from './intersectPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function intersectMultiPolygon(pgs1, pgs2, opt = {}) {
    //尚未使用polybooljs處理MultiPolygon, 故持續使用turf進行intersect

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

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //toMultiPolygon
    pgs1 = toMultiPolygon(pgs1, { supposeType })
    pgs2 = toMultiPolygon(pgs2, { supposeType })

    //multiPolygon
    pgs1 = turf.multiPolygon(pgs1)
    pgs2 = turf.multiPolygon(pgs2)

    //intersect, turf版引用
    let r = turf.intersect(pgs1, pgs2)

    return distilMultiPolygon(r)
}


export default intersectMultiPolygon

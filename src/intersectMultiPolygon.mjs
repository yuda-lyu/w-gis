import each from 'lodash/each'
import isearr from 'wsemi/src/isearr.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import intersectPolygon from './intersectPolygon.mjs'


// function intersectMultiPolygon(pgs1, pgs2) {

//     //check
//     if (!isearr(pgs1)) {
//         return null
//     }
//     if (!isearr(pgs2)) {
//         return null
//     }

//     //intersect, turf版引用
//     let r = turf.intersect(turf.helpers.multiPolygon(toMultiPolygon(pgs1)), turf.helpers.multiPolygon(toMultiPolygon(pgs2)))

//     return distilMultiPolygon(r)
// }


function intersectMultiPolygon(pgs1, pgs2) {

    //check
    if (!isearr(pgs1)) {
        return null
    }
    if (!isearr(pgs2)) {
        return null
    }

    //toMultiPolygon
    let pgs1Temp = toMultiPolygon(pgs1)
    let pgs2Temp = toMultiPolygon(pgs2)

    //pgsTemp, pgs1與pgs2的MultiPolygon轉成同一個Polygon
    let pgsTemp = [...pgs1Temp, ...pgs2Temp]

    //pgs
    let pgs = pgsTemp[0]
    each(pgsTemp, (v, k) => {
        if (k === 0) {
            return true //跳出換下一個
        }
        pgs = intersectPolygon(pgs, v)
    })

    //toMultiPolygon
    pgs = toMultiPolygon(pgs)

    return pgs
}


export default intersectMultiPolygon

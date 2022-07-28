import get from 'lodash/get'
import each from 'lodash/each'
import isearr from 'wsemi/src/isearr.mjs'
import polybooljs from 'polybooljs'
import turf from './getTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


// function intersectMultiPolygon_polybooljs(pgs1, pgs2) {

//     //check
//     if (!isearr(pgs1)) {
//         return null
//     }
//     if (!isearr(pgs2)) {
//         return null
//     }

//     //toMultiPolygon
//     let mpgs1 = toMultiPolygon(pgs1)
//     let mpgs2 = toMultiPolygon(pgs2)

//     //MultiPolygon(pgs1)先合併
//     let mpgs1Temp = mpgs1[0]
//     each(mpgs1, (v, k) => {
//         if (k === 0) {
//             return true //跳出換下一個
//         }
//         mpgs1Temp = intersectPolygon_polybooljs(mpgs1Temp, v)
//     })

//     //MultiPolygon(pgs2)先合併
//     let mpgs2Temp = mpgs2[0]
//     each(mpgs2, (v, k) => {
//         if (k === 0) {
//             return true //跳出換下一個
//         }
//         mpgs2Temp = intersectPolygon_polybooljs(mpgs2Temp, v)
//     })

//     let pgs = intersectPolygon_polybooljs(mpgs1Temp, mpgs2Temp)

//     return pgs
// }


function intersectMultiPolygon_turf(pgs1, pgs2) {

    //check
    if (!isearr(pgs1)) {
        return null
    }
    if (!isearr(pgs2)) {
        return null
    }

    //intersect, turf版引用
    let r = turf.intersect(turf.helpers.multiPolygon(toMultiPolygon(pgs1)), turf.helpers.multiPolygon(toMultiPolygon(pgs2)))

    return distilMultiPolygon(r)
}


function intersectMultiPolygon(pgs1, pgs2) {
    return intersectMultiPolygon_turf(pgs1, pgs2)
}


export default intersectMultiPolygon

// import each from 'lodash-es/each.js'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
// import intersectPolygon from './intersectPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function intersectMultiPolygon(pgs1, pgs2, opt = {}) {
    //尚未使用polybooljs處理MultiPolygon, 故持續使用turf進行intersect

    //check
    if (!isearr(pgs1)) {
        return null
    }
    if (!isearr(pgs2)) {
        return null
    }

    //toMultiPolygon
    pgs1 = toMultiPolygon(pgs1, opt)
    pgs2 = toMultiPolygon(pgs2, opt)

    //multiPolygon
    pgs1 = turf.helpers.multiPolygon(pgs1)
    pgs2 = turf.helpers.multiPolygon(pgs2)

    //intersect, turf版引用
    let r = turf.intersect(pgs1, pgs2)

    return distilMultiPolygon(r)
}


// function intersectMultiPolygon(pgs1, pgs2) {

//     //check
//     if (!isearr(pgs1)) {
//         return null
//     }
//     if (!isearr(pgs2)) {
//         return null
//     }

//     //toMultiPolygon
//     let pgs1Temp = toMultiPolygon(pgs1, opt)
//     let pgs2Temp = toMultiPolygon(pgs2, opt)

//     //pgsTemp, pgs1與pgs2的MultiPolygon轉成同一個Polygon
//     let pgsTemp = [...pgs1Temp, ...pgs2Temp]

//     //pgs
//     let pgs = pgsTemp[0]
//     each(pgsTemp, (v, k) => {
//         if (k === 0) {
//             return true //跳出換下一個
//         }
//         pgs = intersectPolygon(pgs, v)
//     })

//     //toMultiPolygon
//     pgs = toMultiPolygon(pgs, opt)

//     return pgs
// }


export default intersectMultiPolygon

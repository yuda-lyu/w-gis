import each from 'lodash-es/each'
import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import unionPolygon from './unionPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function unionMultiPolygon(pgs1, pgs2, opt = {}) {
    //turf版本可能問題較多, 待測試改用polybooljs.union

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

    //union
    let r = turf.union(pgs1, pgs2)

    return distilMultiPolygon(r)
}


// function unionMultiPolygon(pgs1, pgs2, opt = {}) {

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
//         pgs = unionPolygon(pgs, v)
//     })

//     //toMultiPolygon
//     pgs = toMultiPolygon(pgs, opt)

//     return pgs
// }


export default unionMultiPolygon

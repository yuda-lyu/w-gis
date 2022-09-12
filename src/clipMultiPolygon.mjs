import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
// import clipPolygon from './clipPolygon.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


function clipMultiPolygon(pgs1, pgs2, opt = {}) {
    //尚未使用polybooljs處理MultiPolygon, 故持續使用turf進行difference
    //代表pgs1減去pgs2

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

    //difference
    let r = turf.difference(pgs1, pgs2)

    return distilMultiPolygon(r)
}


// function clipMultiPolygon(pgs1, pgs2) {
//     //代表pgs1減去pgs2

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

//     //pgs
//     let pgs = []
//     each(pgs1Temp, (v1) => {
//         each(pgs2Temp, (v2) => {
//             let r = clipPolygon(v1, v2)
//             if (size(r) > 0) {
//                 pgs.push(r)
//             }
//         })
//     })

//     //toMultiPolygon
//     pgs = toMultiPolygon(pgs, opt)

//     return pgs
// }


export default clipMultiPolygon

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
    pgs1 = turf.multiPolygon(pgs1)
    pgs2 = turf.multiPolygon(pgs2)

    //difference
    let r = turf.difference(pgs1, pgs2) //須使用turf 6.5.0版, 7.0.0以上會出現要求最小須2個元素才能計算錯誤, 待turf修正

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

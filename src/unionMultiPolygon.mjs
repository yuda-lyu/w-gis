import each from 'lodash/each'
import isearr from 'wsemi/src/isearr.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import unionPolygon from './unionPolygon.mjs'


// function unionMultiPolygon(pgs1, pgs2) {
//     //turf版本可能問題較多, 待測試改用polybooljs.union

//     //union
//     let r = turf.union(turf.helpers.multiPolygon(toMultiPolygon(pgs1)), turf.helpers.multiPolygon(toMultiPolygon(pgs2)))

//     return distilMultiPolygon(r)
// }


function unionMultiPolygon(pgs1, pgs2) {

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
        pgs = unionPolygon(pgs, v)
    })

    //toMultiPolygon
    pgs = toMultiPolygon(pgs)

    return pgs
}


export default unionMultiPolygon

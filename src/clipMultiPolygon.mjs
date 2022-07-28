import each from 'lodash/each'
import size from 'lodash/size'
import isearr from 'wsemi/src/isearr.mjs'
import clipPolygon from './clipPolygon.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'


// function clipMultiPolygon(pgs, pgsCut) {
//     //turf版本可能問題較多, 待測試改用polybooljs.difference

//     //difference
//     let r = turf.difference(turf.helpers.multiPolygon(toMultiPolygon(pgs)), turf.helpers.multiPolygon(toMultiPolygon(pgsCut)))

//     return distilMultiPolygon(r)
// }


function clipMultiPolygon(pgs1, pgs2) {
    //代表pgs1減去pgs2

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

    //pgs
    let pgs = []
    each(pgs1Temp, (v1) => {
        each(pgs2Temp, (v2) => {
            let r = clipPolygon(v1, v2)
            if (size(r) > 0) {
                pgs.push(r)
            }
        })
    })

    //toMultiPolygon
    pgs = toMultiPolygon(pgs)

    return pgs
}


export default clipMultiPolygon

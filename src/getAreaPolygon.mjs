import each from 'lodash/each'
import isearr from 'wsemi/src/isearr.mjs'
import toPolygon from './toPolygon.mjs'


function getAreaPolygon(pg) {

    //check
    if (!isearr(pg)) {
        return null
    }

    //toPolygon
    pg = toPolygon(pg)

    function core(polygon) {
        let i = -1
        let n = polygon.length
        let a
        let b = polygon[n - 1]
        let area = 0

        while (++i < n) {
            a = b
            b = polygon[i]
            area += a[1] * b[0] - a[0] * b[1]
        }

        return area / 2
    }

    //core
    let r = 0
    each(pg, (v) => {
        r += core(v) //polygon為多個多邊形組成
    })

    return r
}


export default getAreaPolygon

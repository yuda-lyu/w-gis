import get from 'lodash/get'
import each from 'lodash/each'
import filter from 'lodash/filter'
import cloneDeep from 'lodash/cloneDeep'
import isnum from 'wsemi/src/isnum.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isernot from 'wsemi/src/isernot.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import turf from './importTurf.mjs'
// import invCoordPolygon from './invCoordPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'
// import invCoordMultiPolygon from './invCoordMultiPolygon.mjs'


function fixGeometryMultiPolygon(pgs, opt = {}) {

    //w
    let w = get(opt, 'w', '')
    if (!isnum(w)) {
        w = 0.001
    }
    w = cdbl(w)

    //units
    let units = get(opt, 'units', '')
    if (!isestr(units)) {
        units = 'degrees'
    }

    function core(pg) {

        // //invCoordPolygon, 因為buffer需要輸入正確經緯度才有辦法運算, 預設使用degrees避免座標投影問題
        // pg = invCoordPolygon(pg)

        //pgt
        let pgt = turf.polygon(pg)

        //buffer
        let bf = turf.buffer(pgt, w, { units })

        //distilMultiPolygon, 因buff後可能為多種幾何類型, 故需先統一轉成MultiPolygon
        let pgsNew = distilMultiPolygon(bf)

        // //invCoordMultiPolygon, 變成MultiPolygon後需反轉座標回原始數據之定義方式
        // pgsNew = invCoordMultiPolygon(pgsNew)

        return pgsNew
    }

    //cloneDeep
    pgs = cloneDeep(pgs)

    //core
    let pgsNew = []
    each(pgs, (pg) => {
        let r = core(pg) //回傳是MultiPolygon
        each(r, (v) => {
            pgsNew.push(v)
        })
    })

    //filter
    pgsNew = filter(pgsNew, isernot)

    return pgsNew
}


export default fixGeometryMultiPolygon

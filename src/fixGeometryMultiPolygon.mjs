import each from 'lodash/each'
import filter from 'lodash/filter'
import cloneDeep from 'lodash/cloneDeep'
import isernot from 'wsemi/src/isernot.mjs'
import turf from './getTurf.mjs'
import invCoordPolygon from './invCoordPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'
import invCoordMultiPolygon from './invCoordMultiPolygon.mjs'


function fixGeometryMultiPolygon(pgs) {

    function core(pg) {

        //invCoordPolygon, 因為buffer需要輸入正確經緯度才有辦法運算
        pg = invCoordPolygon(pg)

        //pgt
        let pgt = turf.polygon(pg)

        //buffer
        let bf = turf.buffer(pgt, 1, { units: 'kilometers' })

        //distilMultiPolygon, 因buff後可能為多種幾何類型, 故需先統一轉成MultiPolygon
        let pgsNew = distilMultiPolygon(bf)

        //invCoordMultiPolygon, 變成MultiPolygon後需反轉座標回原始數據之定義方式
        pgsNew = invCoordMultiPolygon(pgsNew)

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

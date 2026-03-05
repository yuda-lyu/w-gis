import map from 'lodash-es/map.js'
import size from 'lodash-es/size.js'
import isEqual from 'lodash-es/isEqual.js'
import isearr from 'wsemi/src/isearr.mjs'
import toPolygon from './toPolygon.mjs'


/**
 * 修復Polygon內各RingString為閉合
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/fixClosePolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @returns {Array} 回傳Polygon陣列
 * @example

 */
function fixClosePolygon(pgs, opt = {}) {

    //check pgs
    if (!isearr(pgs)) {
        throw new Error(`no pgs`)
    }

    //toPolygon
    pgs = toPolygon(pgs)

    //修復成為閉合
    pgs = map(pgs, (rs) => {
        let i0 = 0
        let i1 = size(rs) - 1
        let rs0 = rs[i0]
        let rs1 = rs[i1]
        if (!isEqual(rs0, rs1)) {
            rs.push(rs0)
        }
        return rs
    })

    return pgs
}


export default fixClosePolygon

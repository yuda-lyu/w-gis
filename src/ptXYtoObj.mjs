import get from 'lodash-es/get.js'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'


/**
 * 提取點陣列[x,y]或點物件{x,y}為點物件{x,y}
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/ptXYtoObj.test.mjs Github}
 * @memberOf w-gis
 * @param {Array|Object} p 輸入點陣列或點物件，為[x,y]或{x,y}
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @returns {Object} 回傳點物件{x,y}
 * @example
 *
 * let p
 * let r
 *
 * p = [1, 2]
 * r = ptXYtoObj(p)
 * console.log(r)
 * // => [ 1, 2 ]
 *
 * p = { x: 1, y: 2 }
 * r = ptXYtoObj(p)
 * console.log(r)
 * // => [ 1, 2 ]
 *
 */
function ptXYtoObj(p, opt = {}) {

    //check
    if (!isearr(p) && !iseobj(p)) {
        return {}
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //x, y
    let x = ''
    let y = ''
    if (isearr(p)) {
        x = get(p, 0, '')
        y = get(p, 1, '')
    }
    else if (iseobj(p)) {
        x = get(p, keyX, '')
        y = get(p, keyY, '')
    }

    //check
    if (!isnum(x)) {
        // throw new Error(`x from p[0] or p['${keyX}'] is not an effective number`)
        return {}
    }
    if (!isnum(y)) {
        // throw new Error(`y from p[1] or p['${keyY}'] is not an effective number`)
        return {}
    }
    x = cdbl(x)
    y = cdbl(y)

    return { x, y }
}


export default ptXYtoObj

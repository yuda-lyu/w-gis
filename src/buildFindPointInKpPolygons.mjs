import findPointInKpPolygons from './findPointInKpPolygons.mjs'


/**
 * 判斷點陣列[x,y]或點物件{x,y}是否位於某一多邊形內之字典物件，若有則回傳該特徵之鍵名，若無則回傳def值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/buildFindPointInKpPolygons.test.mjs Github}
 * @memberOf w-gis
 * @returns {Object} 回傳函數物件，包含init、isInit、getPoint函數。init為初始化，輸入kpPgs，無輸出，isInit為回傳是否初始化布林值，無輸入。getPoint為查詢點位於哪個多邊形並回傳該鍵名，輸入p與opt，功能詳見findPointInKpPolygons。
 * @example
 *
 * let kpPgs = {
 *     'pgs1': [
 *         [0, 0],
 *         [0, 1],
 *         [1, 1],
 *         [1, 0],
 *         [0, 0],
 *     ],
 *     'pgs2': [
 *         [1, 1],
 *         [1, 2],
 *         [2, 2],
 *         [2, 1],
 *         [1, 1],
 *     ],
 * }
 * let p
 * let r
 *
 * let BD = buildFindPointInKpPolygons
 * let bd = new BD()
 * await bd.init(kpPgs)
 *
 * p = [0.5, 0.5]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'pgs1'
 *
 * p = [1.5, 1.5]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'pgs2'
 *
 * p = [1.5, 0.5]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'unknow'
 *
 * p = [1.5, 0.5]
 * r = await bd.getPoint(p, { def: '未知' })
 * console.log(r)
 * // => '未知'
 *
 */
function Build() {
    let bInit = false
    let _kp = null

    async function init(kpPgs, opt = {}) {

        //save
        _kp = kpPgs

        //bInit
        bInit = true

    }

    function isInit() {
        return bInit
    }

    async function getPoint(p, opt = {}) {

        //check
        if (!bInit) {
            throw new Error('no init')
        }

        //findPointInKpPolygons
        let value = findPointInKpPolygons(p, _kp, opt)

        return value
    }

    return {
        init,
        isInit,
        getPoint,
    }

}


export default Build

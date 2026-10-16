import _ from 'lodash-es'
import w from 'wsemi'
import getFiles from 'w-package-tools/src/getFiles.mjs'


/**
 * 取得主入口索引(src/WGis.mjs)應匯出之名單, 為src頂層檔案扣除索引自身與'_'開頭之內部檔
 *
 * 名單規則之單一出處(帳本R-ENTRY-1): gPackageIndex產生索引、測試核對索引與產物皆引用之, 不得另寫第二份
 *
 * @param {String} [fd='./src/'] 輸入src資料夾字串, 預設'./src/'
 * @param {String} [fnIndex='WGis.mjs'] 輸入索引檔名字串, 預設'WGis.mjs'
 * @returns {Array} 回傳名稱字串陣列(不含副檔名)
 */
function getIndexNames(fd = './src/', fnIndex = 'WGis.mjs') {

    //getFiles, 只取頂層檔案(子資料夾kriging-*等為內部模組)
    let ltfs = getFiles(fd)

    //pull
    _.pull(ltfs, fnIndex)

    //filter
    ltfs = _.filter(ltfs, (v) => {
        return w.strleft(v, 1) !== '_'
    })

    //get names
    let ns = _.map(ltfs, function(v) {
        return v.replace('.mjs', '')
    })

    return ns
}


export default getIndexNames

import fs from 'fs'
import _ from 'lodash-es'
import w from 'wsemi'
import getFiles from 'w-package-tools/src/getFiles.mjs'


let fd = './src/'
let fnIndex = 'WGis.mjs'


function main() {
    //由src內取得指定函數檔案, 再自動產生WGeo.mjs, 供rollup編譯之用

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

    //scs
    let scs = []
    _.each(ns, function(name) {
        //let sc = `export ${name} from './${name}.mjs'` //stage1語法, 需要安裝@babel/plugin-proposal-export-default-from
        let sc = `export { default as ${name} } from './${name}.mjs'`
        scs.push(sc)
    })

    //merge content, 結尾補換行(eslint之eol-last)
    let c = _.join(scs, '\r\n') + '\r\n'

    //write
    //console.log(c)
    fs.writeFileSync(fd + fnIndex, c, 'utf8')

}
main()

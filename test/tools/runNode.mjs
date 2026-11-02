import { spawn } from 'child_process'


/**
 * 以指定cwd於子行程執行node腳本, 收集stdout與stderr(測試以副本執行toolg腳本用, 帳本R-ENTRY-1、R-ENTRY-2)
 *
 * 子行程之cwd須為測試專用之暫存資料夾(例如test/_tmp/<案名>/), 不可為repo根: toolg腳本皆以cwd相對之./src、./dist運作
 *
 * @param {Array} args 輸入node參數陣列, 首項為腳本路徑(相對cwd或絕對)
 * @param {String} cwd 輸入子行程工作資料夾字串
 * @returns {Promise} 回傳Promise, resolve為{ code, out }, out為stdout與stderr合併之字串
 */
function runNode(args, cwd) {
    return new Promise((resolve, reject) => {
        let out = ''
        let cp = spawn(process.execPath, args, { cwd, windowsHide: true })
        cp.stdout.on('data', (d) => {
            out += d
        })
        cp.stderr.on('data', (d) => {
            out += d
        })
        cp.on('error', reject)
        cp.on('close', (code) => {
            resolve({ code, out })
        })
    })
}


export default runNode

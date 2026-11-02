import { register } from 'node:module'


//用法: node --import ./test/tools/registerWsemiStrict.mjs <腳本>
register('./hookWsemiStrict.mjs', import.meta.url)

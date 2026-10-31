// SPDX-License-Identifier: MIT
import {createRequire} from 'node:module';
export function loadNative() {const require=createRequire(import.meta.url),info=require('@napi-rs/canvas/package.json');if(info.name!=='@napi-rs/canvas'||info.version!=='0.1.100')throw Error('Canvas 0.1.100 required');return require('@napi-rs/canvas');}

// SPDX-License-Identifier: MIT
import {loadNative} from './runtime.mjs';import {checkOutput,writeOutputs} from './io.mjs';import {renderExamples} from './examples.mjs';
const out=checkOutput(process.argv[2]),files=renderExamples(loadNative());writeOutputs(out,files);console.log(JSON.stringify({output:out,files:Object.keys(files),scope:'Two fixed static compositions; no fonts/images/motion',familiesAdded:0}));

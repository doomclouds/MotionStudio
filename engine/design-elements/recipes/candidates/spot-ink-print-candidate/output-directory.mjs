import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
export async function createExternalOutput(argv=process.argv.slice(2)) {
 if(argv.length!==2||argv[0]!=='--out'||!argv[1])throw Error('required: --out /absolute/new-external-directory');
 if(!path.isAbsolute(argv[1]))throw Error('--out must be absolute');
 const requested=path.resolve(argv[1]),root=await fs.realpath(path.dirname(fileURLToPath(import.meta.url)));
 const parent=await fs.realpath(path.dirname(requested)),out=path.join(parent,path.basename(requested));
 if(out===root||out.startsWith(root+path.sep))throw Error('--out cannot be inside package');
 // Nonrecursive exclusive mkdir: parent must exist, destination must not exist (incl symlinks).
 await fs.mkdir(out);return out;
}

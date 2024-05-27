const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require('crypto');

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    const hash = process.argv[4];
    readBlobContent(hash);
    break;
  case "hash-object":
    const file = process.argv[4];
    computeHash(file);
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");
  console.log("Initialized git directory");
}
async function readBlobContent(hash) {
  const content = await fs.readFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2))); //reads blob content at 
	const dataUnzipped = zlib.inflateSync(content); 
	const res = dataUnzipped.toString().split('\0')[1]; //
	process.stdout.write(res); // print result to stdout
}
async function computeHash(file){
  // hash = file.slice(0,2) + file.slice(2);
// header + size
if (process.argv[3] !== "-w"){
  return;
}

try{
  const data = await fs.readFileSync(file, 'utf-8');
  const size = data.length;
  const header = `blob ${size}\x00`;
  const store = header + data;
  try {
  const hash = crypto.createHash('sha-1').update(store).digest('hex');
  try {
    fs.mkdirSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2)), { recursive: true});
    fs.writeFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2)), zlib.deflateSync(file));
    } catch (err) {
      console.log("Error: Couldn't Write File");
    }
    process.stdout.write(hash);
  } catch (err){
    console.log("Couldn't Compute Hash");
  }
 } catch (err) {
    console.log("Error: Couldn't Read File");
  }
  
  

}


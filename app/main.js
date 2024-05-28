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
    computeHash();
    break;
  case "ls-tree":
    const treeHash = process.argv[4];
    readTree(treeHash);
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
function computeHash(){
  // hash = file.slice(0,2) + file.slice(2);
// header + size
if (process.argv[3] !== "-w"){
  return;
}
  const file = process.argv[4];
  const data = fs.readFileSync(file, 'utf-8');
  const size = data.length;
  const header = `blob ${size}\x00`;
  const store = header + data;
  const hash = crypto.createHash('sha1').update(store).digest('hex');
  try {
    fs.mkdirSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2)), { recursive: true});
    fs.writeFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2)), zlib.deflateSync(store));
    } catch (err) {
      console.log("Error: Couldn't Write File");
    }
    process.stdout.write(hash);
  } 
async function readTree(hash){
  const content = await fs.readFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2))); // reads tree content
  const dataUnzipped = zlib.inflateSync(content); // zlib compression
  const elements = dataUnzipped.toString();
  const arrayOfElements = elements.split('\0');
  const arrayOfNames = [];
  for (let i = 1; i < arrayOfElements.length - 1; i++){
    const spaceSplit = arrayOfElements[i].split(' ')[1];
    arrayOfNames.push(spaceSplit);
  }
  arrayOfNames.sort();
  names = ""
  for (let name in arrayOfElements){
    names += arrayOfElements[name].split(" ")[1] + "\n";
    
  }
  process.stdout.write(names);
}

const extractBetween = (str, startChar, endChar) => {
  const startIndex = str.indexOf(startChar);
  const endIndex = str.indexOf(endChar, startIndex + 1);

  if (startIndex !== -1 && endIndex !== -1) {
    return str.substring(startIndex + 1, endIndex);
  } else {
    return null; // or handle error as needed
  }
};



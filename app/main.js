const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require('crypto');
const https = require('https');
// const app = require('express')();

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
  case "write-tree":
    // const wd = path.join(process.cwd(), ".git", "objects");
    // const s = createTree(wd);
    process.stdout.write(createTree());
    break;
  case "commit-tree":
    const treeSha = process.argv[3];
    const parentHash = process.argv[5];
    const message = process.argv[7];
    process.stdout.write(createCommit(treeSha, parentHash, message));
    break;
  case "clone":
    const gitURL = process.argv[3];
    const someDir = process.argv[4];
    process.stdout.write(cloneRepo(gitURL, someDir));
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
	const res = dataUnzipped.toString().split('\0')[1]; 
	process.stdout.write(res); // print result to stdout
}
function computeHash(){
  // hash = file.slice(0,2) + file.slice(2);
// header + size
if (process.argv[3] !== "-w"){
  return;
}
  const file = process.argv[4];
  // const data = fs.readFileSync(file, 'utf-8');
  // const size = data.length;
  // const header = `blob ${size}\x00`;
  // const store = header + data;
  const hash = createBlob(file);
  try {
    
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
  const arrayOfNames = []
  names = ""
  for (let i = 1; i < arrayOfElements.length - 1; i++){
    arrayOfNames.push(arrayOfElements[i].split(" ")[1] + "\n")
  }
  const filteredNames = arrayOfNames.filter((name) => name != null || name != undefined)
 for (score of filteredNames){
    names += score;
 }
  process.stdout.write(names);
}


function createBlob(file){
  // creates blob and returns hash
  const data = fs.readFileSync(file, 'utf-8');
  const size = data.length;
  const header = `blob ${size}\x00`;
  const store = header + data;
  const hash = crypto.createHash('sha1').update(store).digest('hex');
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2)), { recursive: true});
  fs.writeFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2)), zlib.deflateSync(store));
  return hash;
}

function createTree(dir = process.cwd()){
  const filesAndDirs = fs
    .readdirSync(dir)
    .filter((f) => f !== ".git" && f !== "main.js");
  // this is the last step
  const entries = [];
  for (const file of filesAndDirs) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isFile()) {
      entries.push({
        mode: 100644,
        name: file,
        hash: createBlob(fullPath),
      });
    } else {
      entries.push({
        mode: 40000,
        name: file,
        hash: createTree(fullPath),
      });
    }
  }
  // const treeData = entries.map((e) => `${e.mode} ${e.name}\x00${Buffer.from(e.hash, "hex")}`).join("");

  // for (let x in entries) {
  //   console.log(entries[x]);
  // }
  const contents = entries.reduce((acc, { mode, name, hash }) => {
    return Buffer.concat([
      acc,
      Buffer.from(`${mode} ${name}\0`),
      Buffer.from(hash, "hex"),
    ]);
  }, Buffer.alloc(0));
  const header = `tree ${contents.length}\0`;
  const store = Buffer.concat([Buffer.from(header), contents]);
  const hash = crypto.createHash('sha1').update(store).digest("hex").toString();
  fs.mkdirSync(path.join(dir, ".git", "objects", hash.slice(0, 2)), { recursive: true});
  fs.writeFileSync(path.join(dir, ".git", "objects", hash.slice(0, 2), hash.slice(2)), zlib.deflateSync(store));
  return hash; // cannot be hex
}
function createCommit(treeHash, parentHash, message = ""){
   // 1. generate content
       // commit {size}\0 {content}
       //{content} = 1. {tree_sha}, 2. parent, 3.committer 4. commit message
       // parent {parent1_sha}
       message += "\n";
       const treeHeader = `tree ${treeHash}\n`;
       const parent = `parent ${parentHash}\n`;
       const unixTimestampSeconds = Math.floor(Date.now() / 1000);
       const date = new Date();
       const timezone = date.getTimezoneOffset();
       const author = `author author_name <author_name.gmail.com> ${unixTimestampSeconds} ${timezone}\n`;
       const commiter = `commiter jonathan <jonathan@gmail.com> ${unixTimestampSeconds} ${timezone}\n\n`;
       const contents = Buffer.concat([Buffer.from(treeHeader), Buffer.from(parent), Buffer.from(author), Buffer.from(commiter), Buffer.from(message)]);
       const commitHeader = `commit ${contents.length}\0`;
       const store = Buffer.concat([Buffer.from(commitHeader), contents]);
       const hash = crypto.createHash('sha1').update(store).digest("hex").toString();
       fs.mkdirSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2)), { recursive: true});
      fs.writeFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2)), zlib.deflateSync(store));
      return hash;
      

       //tree {tree_sha}
      // {parents}
      // author {author_name} <{author_email}> {author_date_seconds} {author_date_timezone}
      // committer {committer_name} <{committer_email}> {committer_date_seconds} {committer_date_timezone}

      // {commit message}
}

function cloneRepo(url, dir){
  //request for objects
  
  // const startIndex = url.indexOf(":");

  // const endIndex = url.indexOf("/");
  // const PORT = url.substring(startIndex + 1, endIndex);
  // app.listen(PORT, () => {
  // console.log(f`Listening to Git at ${PORT}`);
  // });
  url += "/info/refs?service=git-upload-pack";
 
  https.get(url, (res) => {
    if (res == undefined){
      console.log("Error");
    }
    // console.log(res);
    res.on('error', (error) => {
      console.error('An error occurred:', error);
    });
    let data = "";
    
  // As data comes in, append it to the 'data' variable
  // res.on('data', (chunk) => {
  //   if (typeof chunk === "undefined"){
  //     console.log("Chunk undefined");
  //   }
  // });
  
  // When the response ends, log the data received
  res.on('end', () => {
    console.log('Data received:', data);
    return data;
  });
});

// Handle errors during the request
  return "y";
  }
    
    
  
  
//   )
// }


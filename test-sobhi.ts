import http from "https";

function checkUrl(url: string) {
  return new Promise((resolve) => {
    const req = http.request(url, { method: "HEAD" }, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    req.on("error", (e) => {
      console.log(`URL: ${url} -> Error: ${e.message}`);
      resolve(false);
    });
    req.end();
  });
}

async function testSobhiUrls() {
  console.log("Testing Islam Sobhi MP3 URLs...");
  await checkUrl("https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/067.mp3");
  await checkUrl("https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/055.mp3");
  await checkUrl("https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/001.mp3");
}

testSobhiUrls();

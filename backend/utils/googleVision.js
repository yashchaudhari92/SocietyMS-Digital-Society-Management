const vision = require("@google-cloud/vision");
const path = require("path");

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../google-credentials.json"),
});

exports.extractTextFromImage = async (imagePath) => {
  const [result] = await client.textDetection(imagePath);

  return result.fullTextAnnotation?.text || "";
};



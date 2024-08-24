import { getFile } from "../utils/s3fileUpload.js";


async function sendFileFromS3(req, res) {
    const key = req.query?.k || "";

    const fileStream = await getFile(key);

    if (!fileStream) {
        return res.status(404).send("File not found");
    }

    // Set appropriate headers based on the file metadata
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);

    // Pipe the S3 file stream to the Express response
    fileStream.pipe(res);
}


export { sendFileFromS3 }
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import fs from 'fs';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET_NAME) {
    throw new Error("Missing AWS configuration");
}

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Function to get file type and video duration
const getFileInfo = (filePath) => {
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(err);
            }

            // Get the format name (file type)
            const fileType = metadata.format.format_name;

            // Check if it's a video and get the duration
            const isVideo = metadata.streams.some(stream => stream.codec_type === 'video');
            const duration = isVideo ? metadata.format.duration : null;

            resolve({ fileType, isVideo, duration });
        });
    });
};

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export async function uploadFileS3(localFilePath, s3Key) {
    try {
        if (!localFilePath) {

            console.error("local path is not given");
            return null
        }

        const fileContent = fs.readFileSync(localFilePath);

        // Set up S3 upload parameters
        const params = {
            Bucket: AWS_S3_BUCKET_NAME, // The S3 bucket name
            Key: s3Key,
            Body: fileContent,
            ACL: "private",
        };

        const command = new PutObjectCommand(params);

        const data = await s3.send(command);
        console.log(`File uploaded successfully at ${data.$metadata}`);

        fs.unlinkSync(localFilePath, () => {
            console.log(`${localFilePath} deleted.`);
        })

        return data;

    } catch (error) {

        fs.unlinkSync(localFilePath, () => {
            console.log(`${localFilePath} deleted.`);
        })
        console.error('Error uploading file:', error);
        return null;
    }
}

export async function getFile(objKey) {
    try {
        if (!objKey) {
            return null;
        }

        const params = {
            Bucket:  AWS_S3_BUCKET_NAME, // Replace with your S3 bucket name
            Key: objKey,
        };

        const command = new GetObjectCommand(params);
        const response = await s3.send(command);

        return response.Body; // The Body is a stream
    } catch (error) {
        return null;
    }
}
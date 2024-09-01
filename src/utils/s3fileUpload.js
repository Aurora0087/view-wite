import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import fs from 'fs';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET_NAME) {
    throw new Error("Missing AWS configuration");
}

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

// uploading file

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

// geting file

export async function getFile(objKey) {
    try {
        if (!objKey) {
            return null;
        }

        const params = {
            Bucket:  AWS_S3_BUCKET_NAME,
            Key: objKey,
        };

        const command = new GetObjectCommand(params);
        const response = await s3.send(command);

        return response.Body;
    } catch (error) {
        return null;
    }
}

// delting file with objKey

export async function deleteS3File(objKey) {

    try {
        if (!objKey) {
            return null;
        }

        const params = {
            Bucket:  AWS_S3_BUCKET_NAME, // Replace with your S3 bucket name
            Key: objKey,
        };

        const command = new DeleteObjectCommand(params);
        const response = await s3.send(command);

        return response;

    } catch (error) {
        return null
    }
}
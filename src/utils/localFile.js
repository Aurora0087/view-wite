import fs from "fs";

export function deleteLocalFiles(filePath) {
    filePath.map((path) => {
        try {
            fs.unlinkSync(path, () => {
                console.log(path, " Deleted...");

            })
        } catch (error) {
            console.log("Error deleting files from local path.", error);
        }
    })
};
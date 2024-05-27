// import express, { Request, Response } from "express";
// import multer, { MulterError } from "multer";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// const s3 = new S3Client({
//   region: "us-east-1",
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
//   endpoint: process.env.AWS_ENDPOINT,
// });

// const storage = multer.memoryStorage();
// let upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 1000 * 1024 * 1024 * 1024,
//   },
// });

// export const uploadFile = async (req: Request, res: Response) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded." });
//     }

//     const params = {
//       Bucket: process.env.S3_BUCKET_NAME!,
//       Key: req.file.originalname,
//       Body: req.file.buffer,
//     };

//     s3.send(new PutObjectCommand(params), (err: any, data: any) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: "Error uploading file" });
//       }

//       res.json({ message: "File uploaded successfully" });
//     });
//   } catch (error) {
//     console.error(error);
//   }
// };
// // **************************************************************************************

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

// async function extractTextFromPdf(file: any) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }

// async function getEmbedding() {
//   const pdfContent = await extractTextFromPdf("./path/to/your/PDFFile.pdf");
//   const response = await openai.createEmbedding({
//     model: "text-embedding-ada-002",
//     input: pdfContent,
//   });
//   console.log(response.data.data);
//   console.log(response.data.usage.total_tokens);
// }

// getEmbedding();
// // **************************************************************************************

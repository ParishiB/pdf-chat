import express, { Request, Response } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { handlePDFUpload } from "./utils/worker";
import axios from "axios";

dotenv.config();

const app = express();
const port = 3000;
const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_ENDPOINT,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

app.use(express.json());

// app.post(
//   "/upload",
//   upload.single("file"),
//   async (req: Request, res: Response) => {
//     console.log("Request body:", req.body);
//     console.log("Uploaded file:", req.file);
//     try {
//       const { title, description } = req.body;
//       if (!title || !description) {
//         return res.status(400).json({ error: "title or description missing." });
//       }
//       if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded." });
//       }
//       const pdfText = await pdfParse(req.file.buffer).then((data) => data.text);
//       console.log("pdfText:", pdfText);
//       const openaiResponse = await axios.post(
//         "https://api.openai.com/v1/embeddings",
//         {
//           input: pdfText,
//           model: "text-embedding-ada-002",
//           encoding_format: "float",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const params = {
//         Bucket: process.env.S3_BUCKET_NAME!,
//         Key: req.file.originalname,
//         Body: req.file.buffer,
//         ContentType: req.file.mimetype,
//       };

//       const command = new PutObjectCommand(params);
//       await s3.send(command);

//       const pdfUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.originalname}`;

//       console.log(openaiResponse);
//       const embeddingData: any = openaiResponse.data.data.embeddings;

//       const project = await prisma.project.create({
//         data: {
//           title,
//           description,
//           pdfUrl,
//         },
//       });
//       console.log("Embedding data:", embeddingData);
//       res.status(201).json(project);
//     } catch (error) {
//       console.error("Error uploading the file:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   }
// );

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);
    try {
      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: "title or description missing." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }
      await handlePDFUpload(req, res);

      res.status(201).json("PDF upload successful");
    } catch (error) {
      console.error("Error uploading the file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

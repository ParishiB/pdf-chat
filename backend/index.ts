import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import pdf from "pdf-parse";
import PDFParser from "pdf-parse";
import fs from "fs";
import axios from "axios";
import { getEmbeddings } from "./utils/openai";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const port = 4000;

const prisma = new PrismaClient();

app.use(express.json());

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_ENDPOINT,
});
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

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

      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: req.file.originalname,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const pdfUrl = `https://pub-313447e48ea04e97bb2b9a74a980a95e.r2.dev/${req.file.originalname}`;
      const project = await prisma.project.create({
        data: {
          title,
          description,
          pdfUrl,
        },
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Error uploading the file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

async function processPDF(pdfUrl: string): Promise<string> {
  try {
    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    const pdfData = response.data;
    const pdfText = await pdf(pdfData);
    return pdfText.text;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error("Failed to process PDF");
  }
}

app.post("/processFile", async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const project = await prisma.project.findFirst({
      where: { id },
    });
    if (!project) {
      return res.status(400).json({ message: "Project not found" });
    }
    console.log("Found Project:", project);

    try {
      const allText = await processPDF(project.pdfUrl);
      console.log("the text of the pdf :", allText);

      const embedding = await getEmbeddings(allText);
      await prisma.project.update({
        where: { id: project.id },
        data: {
          embedding,
        },
      });

      return res.status(200).json({ message: "File processed successfully" });
    } catch (fetchError) {
      console.error("Error during fetch:", fetchError);
      return res.status(500).json({ message: "Error fetching file contents" });
    }
  } catch (error) {
    console.error("Error turning the file into vector embeddings", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// app.post("/ask", async (req: Request, res: Response) => {
//   try {
//     const { question, id } = req.body;
//     if (!question || !id) {
//       return res
//         .status(400)
//         .json({ message: "Question and project ID are required" });
//     }

//     const project = await prisma.project.findUnique({
//       where: { id },
//     });

//     if (!project || !project.embedding) {
//       return res
//         .status(400)
//         .json({ message: "Project not found or embeddings missing" });
//     }

//     const embeddings = project.embedding;

//     if (!embeddings) {
//       return res
//         .status(400)
//         .json({ message: "Embeddings are missing or invalid" });
//     }

//     const prompt = `Given the following context extracted from the PDF document:\n\n${embeddings}\n\nAnswer the following question:\n\nQ: ${question}\nA:`;

//     // const response = await axios.post(
//     //   "https://api.openai.com/v1/completions",
//     //   {
//     //     model: "gpt-3.5-turbo",
//     //     prompt: prompt,
//     //     max_tokens: 500,
//     //     temperature: 0.5,
//     //   },
//     //   {
//     //     headers: {
//     //       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     //     },
//     //   }
//     // );

//     const response = await axios.post(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         model: "gpt-3.5-turbo",
//         messages: [{ role: "user", content: `${prompt}` }],
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//         },
//       }
//     );

//     const chatGptResponse = response.data.choices[0].message.content;

//     console.log(chatGptResponse);
//   } catch (error: any) {
//     console.error("Error processing question:", error);
//     console.error("Error message:", error.message);
//     console.error("Error stack:", error.stack);
//     console.error("Error response data:", error.response?.data);
//     console.error("Error response status:", error.response?.status);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

app.post("/ask", async (req: Request, res: Response) => {
  try {
    const { question, id } = req.body;

    if (!question || !id) {
      return res
        .status(400)
        .json({ message: "Question and project ID are required" });
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project || !project.embedding) {
      return res
        .status(400)
        .json({ message: "Project not found or embeddings missing" });
    }

    const embeddings = project.embedding;

    if (!embeddings) {
      return res
        .status(400)
        .json({ message: "Embeddings are missing or invalid" });
    }

    const prompt = `Given the following context extracted from the PDF document:\n\n${embeddings}\n\nAnswer the following question:\n\nQ: ${question}\nA:`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const chatGptResponse = response.data.choices[0].message.content;
    console.log(chatGptResponse);

    res.status(200).json({ answer: chatGptResponse });
  } catch (error: any) {
    console.error("Error processing question:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
app.post("/askQuestion", async (req: AskQuestionRequest, res: Response) => {
  //cosine similarity
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

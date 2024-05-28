import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import PDFParser from "pdf-parse";

import axios from "axios";
import { getEmbeddings } from "./utils/openai";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const port = 3000;
const prisma = new PrismaClient();

app.use(express.json());

app.post("/processFile", async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(400).json({ message: "HTTP method not allowed" });
  }
  try {
    const { id } = req.body;
    const project = await prisma.project.findFirst({
      where: { id },
    });

    if (!project) {
      return res.status(400).json({ message: "File not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileResponse = await fetch(project.pdfUrl);
    if (!fileResponse.ok) {
      return res.status(500).json({ message: "Error getting file contents" });
    }
    const pdfBuffer = req.file.buffer;
    const pdfData = await PDFParser(pdfBuffer);

    const allText = pdfData.text;

    const embedding = await getEmbeddings(allText);
    await prisma.project.update({
      where: { id },
      data: {
        embedding,
      },
    });

    return res.status(200).json({ message: "File processed successfully" });
  } catch (error) {
    console.error("Error turning the file into vector embeddings", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

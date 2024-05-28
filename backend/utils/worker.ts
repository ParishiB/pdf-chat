import { Worker, Queue } from "bullmq";
import { Request, Response } from "express";
import PDFParser from "pdf-parse";
import IORedis from "ioredis";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

const pdfParsingQueue = new Queue("pdfParsingQueue", { connection });

const worker = new Worker(
  "pdfParsingQueue",
  async (job) => {
    const { pdfBuffer } = job.data;

    try {
      const pdfData = await PDFParser(pdfBuffer);
      const text = pdfData.text;
      return text;
    } catch (error) {
      console.error("Error parsing PDF:", error);
      throw error;
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(
    `PDF parsing job ${job.id} completed with result: ${job.returnvalue}`
  );
});

console.log("Git check");

async function enqueuePDFParsingJob(pdfBuffer: Buffer): Promise<void> {
  await pdfParsingQueue.add("parsePDF", { pdfBuffer });
}

async function handlePDFUpload(req: Request, res: Response) {
  try {
    const pdfBuffer: any = req.file?.buffer;

    await enqueuePDFParsingJob(pdfBuffer);

    res.status(200).send("PDF parsing job enqueued successfully");
  } catch (error) {
    console.error("Error processing PDF upload:", error);
    res.status(500).send("Internal server error");
  }
}

export { handlePDFUpload };

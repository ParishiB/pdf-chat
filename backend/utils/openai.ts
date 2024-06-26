// const { OpenAI } = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const OPEN_AI_EMBEDDING_MODEL = "text-embedding-ada-002";
// const OPEN_AI_COMPLETION_MODEL = "text-davinci-003";

// export const getEmbeddings = async (text: any) => {
//   const response = await openai.createEmbedding({
//     model: OPEN_AI_EMBEDDING_MODEL,
//     input: text,
//   });
//   return response.data.data[0].embedding;
// };

// export const getCompletion = async (prompt: any) => {
//   const completion = await openai.createCompletion({
//     model: OPEN_AI_COMPLETION_MODEL,
//     prompt: prompt,
//     max_tokens: 500,
//     temperature: 0,
//   });

//   console.log(completion.data.choices);

//   return completion.data.choices[0].text;
// };
import { Configuration, OpenAIApi } from "openai";

// Initialize the OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const OPEN_AI_EMBEDDING_MODEL = "text-embedding-ada-002";
const OPEN_AI_COMPLETION_MODEL = "text-davinci-003";

export const getEmbeddings = async (text: string) => {
  try {
    const response = await openai.createEmbedding({
      model: OPEN_AI_EMBEDDING_MODEL,
      input: text,
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
};

export const getCompletion = async (prompt: string) => {
  try {
    const completion = await openai.createCompletion({
      model: OPEN_AI_COMPLETION_MODEL,
      prompt: prompt,
      max_tokens: 500,
      temperature: 0,
    });

    console.log(completion.data.choices);

    return completion.data.choices[0].text;
  } catch (error) {
    console.error("Error creating completion:", error);
    throw error;
  }
};

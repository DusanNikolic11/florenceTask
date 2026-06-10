export interface ProcessingResult {
  filename: string;
  result: number;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const processDocument = async (filename: string): Promise<ProcessingResult> => {
  await sleep(500);
  return { filename, result: Math.floor(Math.random() * 10_000) };
};

import { Queue } from "bullmq"
import { connection } from "./redis-connection.js"

export const rebrandQueue = new Queue("rebrand-queue", { connection })

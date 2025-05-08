import { Queue } from "bullmq"
import { connection } from "../config/redis.js"

export const rebrandQueue = new Queue("rebrand-queue", { connection })

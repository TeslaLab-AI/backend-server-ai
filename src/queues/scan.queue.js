import { Queue }
from "bullmq";

import redis
from "../config/redis.js";

const scanQueue = new Queue(
  "repo-scan",
  {
    connection: redis
  }
);

export default scanQueue;
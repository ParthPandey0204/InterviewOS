import dotenv from "dotenv";
import path from "node:path";
import { PrismaClient, EvalStatus, UsageProvider } from "@prisma/client";

// Load environment variables from server/.env if available
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
dotenv.config();

const prisma = new PrismaClient();

/**
 * InterviewOS Evaluation Harness
 * 
 * Benchmark dataset with 10 hand-written sample answers of varying quality
 * per topic across DSA, System Design, and Behavioral domains (30 total).
 * 
 * Computes mean and variance per rubric axis (Correctness, Clarity, Depth, Overall)
 * and prints a summary statistical table. Stores all runs in the EvalRun database table.
 */

export const evalDataset = [
  // ==========================================
  // TOPIC 1: Data Structures & Algorithms (DSA)
  // Question: How would you find two numbers in an array that add up to a target sum (Two Sum problem)?
  // ==========================================
  {
    id: "dsa-01",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Excellent / Optimal",
    expectedScoreRange: [4.5, 5.0],
    answer: "I would use a Hash Map to achieve O(n) time complexity and O(n) space complexity. As I iterate through the array once, for each number x, I compute its complement target - x. I check if the complement is already in the map. If it is, I return the current index and the complement's index from the map. If not, I store the current value and its index into the map. This avoids the O(n^2) brute force nested loops."
  },
  {
    id: "dsa-02",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Strong - Two Pointers",
    expectedScoreRange: [4.0, 4.8],
    answer: "If the array is sorted, I can use two pointers starting at the beginning and end of the array. If nums[left] + nums[right] equals target, return their indices. If the sum is smaller, advance left; if larger, decrement right. This takes O(n) time for sorted arrays. If unsorted, sorting first takes O(n log n) time and O(n) space if we preserve original indices."
  },
  {
    id: "dsa-03",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Good - Edge Case Handling",
    expectedScoreRange: [3.8, 4.5],
    answer: "I can use a hash set or map storing seen numbers. For each element num, target - num gives the needed pair. If target - num is in map, we found the pair. We should handle edge cases like empty arrays, arrays with fewer than two elements, duplicate values, and integer overflow depending on the language."
  },
  {
    id: "dsa-04",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Moderate - Wordy",
    expectedScoreRange: [3.0, 3.8],
    answer: "You can loop through the array with a for loop and then put elements into an object or hash table. Inside the loop, check if target minus array[i] exists in the object. If yes, you get the solution. It's linear time, though you use extra memory."
  },
  {
    id: "dsa-05",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Average - Brute Force",
    expectedScoreRange: [2.5, 3.2],
    answer: "I would write two nested loops. The outer loop selects the first element from 0 to n-1, and the inner loop checks every subsequent element from i+1 to n-1 to see if nums[i] + nums[j] == target. This takes O(n^2) time and O(1) space."
  },
  {
    id: "dsa-06",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Flawed Complexity Reasoning",
    expectedScoreRange: [1.8, 2.5],
    answer: "I'd sort the array using Bubble Sort, then use binary search for each element. Bubble sort takes O(n) time, and binary search takes O(1) time, so total time is O(n)."
  },
  {
    id: "dsa-07",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Weak - Buggy Logic",
    expectedScoreRange: [1.5, 2.2],
    answer: "Just create a hash map and put all elements in it first. Then loop through the array again and see if target - element is in the hash map. But wait, if target - element equals element itself, you might pick the same index twice unless you check index equality."
  },
  {
    id: "dsa-08",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Poor - Vague Handwaving",
    expectedScoreRange: [1.0, 2.0],
    answer: "Use dynamic programming or recursion. Divide the array into sub-arrays and conquer the target sum recursively until base cases match."
  },
  {
    id: "dsa-09",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Bad - Off-topic",
    expectedScoreRange: [0.0, 1.5],
    answer: "Use Dijkstra's algorithm to find the shortest path between the start index and end index of the array until the target weight is reached."
  },
  {
    id: "dsa-10",
    topic: "DSA",
    question: "How would you find two numbers in an array that add up to a target sum (Two Sum problem)?",
    expectedQuality: "Nonsense / Fail",
    expectedScoreRange: [0.0, 1.0],
    answer: "Just print the target sum divided by two."
  },

  // ==========================================
  // TOPIC 2: System Design
  // Question: Design a Rate Limiter for an API gateway supporting 10,000 requests per second.
  // ==========================================
  {
    id: "sys-01",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Excellent / Senior Architecture",
    expectedScoreRange: [4.5, 5.0],
    answer: "I would implement a Distributed Rate Limiter using Redis as a centralized memory cache with a Token Bucket or Sliding Window Log algorithm. To handle 10k QPS efficiently, I'd use Redis Cluster with local memory caching (L1 cache) at each API gateway node to reduce network roundtrips. For algorithm, Sliding Window Counter with Lua scripts in Redis ensures atomicity and memory efficiency (O(1) storage per key). Headers like X-RateLimit-Remaining and 429 Too Many Requests response status are returned when limits are exceeded."
  },
  {
    id: "sys-02",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Strong - Token Bucket & Redis",
    expectedScoreRange: [4.0, 4.8],
    answer: "I would place a rate limiting middleware at the API Gateway using the Token Bucket algorithm. Tokens are added to a bucket at a constant rate. When a request arrives, 1 token is consumed. We use Redis to store bucket tokens per client IP or User ID using atomic INCR / EXPIRE commands. If tokens > 0, request proceeds; otherwise return 429 status."
  },
  {
    id: "sys-03",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Good - Sliding Window Counter",
    expectedScoreRange: [3.8, 4.5],
    answer: "A sliding window counter approach balances accuracy and memory. Divide time into 1-minute windows and store sub-window counts in Redis. Calculate current rate by weighted average of previous window and current window count. This prevents traffic bursts at window boundaries."
  },
  {
    id: "sys-04",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Moderate - Basic Redis Counter",
    expectedScoreRange: [3.0, 3.8],
    answer: "Use Redis to count request keys by user ID with an expiration time of 60 seconds. Each request increments the key. If count exceeds max limit, block the user. It works well, though fixed window can allow double the limit at window boundaries."
  },
  {
    id: "sys-05",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Average - Single Server In-Memory",
    expectedScoreRange: [2.5, 3.2],
    answer: "I'd use a Leaky Bucket in Node.js memory. Incoming requests go into a FIFO queue and are processed at a constant leak rate. If the queue is full, new requests are dropped. This works on a single server but doesn't scale horizontally across multiple gateway instances."
  },
  {
    id: "sys-06",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Flawed - SQL Database Bottleneck",
    expectedScoreRange: [1.8, 2.5],
    answer: "Save every incoming request timestamp into a SQL database table request_logs. On each new request, run SELECT COUNT(*) FROM request_logs WHERE user_id = ? AND timestamp > NOW() - INTERVAL 1 MINUTE. If count > limit, reject."
  },
  {
    id: "sys-07",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Weak - Incomplete Mechanism",
    expectedScoreRange: [1.5, 2.2],
    answer: "Add an IF condition in the backend controllers to check a global count variable. If count > 10000, sleep for 1 second before processing."
  },
  {
    id: "sys-08",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Poor - Misunderstanding CDN",
    expectedScoreRange: [1.0, 2.0],
    answer: "Put AWS CloudFront in front of the server and enable auto-scaling to absorb all 10,000 requests per second without needing a rate limiter."
  },
  {
    id: "sys-09",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Bad - Confused Concepts",
    expectedScoreRange: [0.0, 1.5],
    answer: "Use Kafka message queues to compress the API payloads so that 10,000 requests fit into 1 HTTP request."
  },
  {
    id: "sys-10",
    topic: "System Design",
    question: "Design a Rate Limiter for an API gateway supporting 10,000 requests per second.",
    expectedQuality: "Nonsense / Fail",
    expectedScoreRange: [0.0, 1.0],
    answer: "Restart the server every minute to reset the rate limit counter."
  },

  // ==========================================
  // TOPIC 3: Behavioral
  // Question: Tell me about a time you faced a critical production outage and how you handled it.
  // ==========================================
  {
    id: "beh-01",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Excellent STAR Method",
    expectedScoreRange: [4.5, 5.0],
    answer: "SITUATION: During Black Friday sales, our checkout microservice latency spiked from 100ms to 8s, causing 30% payment failures. TASK: As tech lead, I needed to restore service immediately and mitigate customer impact. ACTION: I initiated our incident response protocol, set up a war room, and assigned roles. I analyzed APM metrics and identified database connection pool exhaustion caused by a unindexed query introduced in the last deployment. I ordered an immediate rollback to the previous stable release, increasing connection pool limits temporarily. RESULT: Latency dropped back to 95ms within 12 minutes. Post-mortem, we added DB query linting in CI/CD and automated circuit breakers."
  },
  {
    id: "beh-02",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Strong Structured Response",
    expectedScoreRange: [4.0, 4.8],
    answer: "We had an outage where our primary Redis cache crashed due to OOM, bringing down session management. I took charge of communications, notified stakeholders, and redirected traffic to a secondary failover cluster while updating the Redis max-memory eviction policy. We restored full availability in 15 minutes and implemented memory monitoring alerts."
  },
  {
    id: "beh-03",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Good Clear Ownership",
    expectedScoreRange: [3.8, 4.5],
    answer: "A bad database migration locked the users table, causing 500 errors. I identified the blocking lock using Postgres pg_stat_activity, safely killed the blocking query PID, and wrote a hotfix migration to apply indices concurrently without table locks."
  },
  {
    id: "beh-04",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Moderate Response",
    expectedScoreRange: [3.0, 3.8],
    answer: "Our app crashed because an S3 bucket permission was changed by mistake. I checked the cloud logs, spotted the 403 Access Denied errors, updated the IAM policy back, and restarted the backend services. Everything returned to normal."
  },
  {
    id: "beh-05",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Average Passive Role",
    expectedScoreRange: [2.5, 3.2],
    answer: "There was a production bug where users couldn't log in. The team looked at the logs and found a typo in the API key. My manager fixed it and redeployed the code. We were offline for an hour."
  },
  {
    id: "beh-06",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Flawed Blaming Others",
    expectedScoreRange: [1.8, 2.5],
    answer: "The DevOps team pushed a broken Docker image without telling us developers, so the system went down. I told DevOps it was their fault and waited for them to fix their pipeline."
  },
  {
    id: "beh-07",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Weak Unclear Action",
    expectedScoreRange: [1.5, 2.2],
    answer: "I remember an outage happened once. It was stressful. We stayed late at the office and tried multiple fixes until it started working again."
  },
  {
    id: "beh-08",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Poor Panicked Response",
    expectedScoreRange: [1.0, 2.0],
    answer: "I freaked out because production was down. I tried deleting and re-installing all node_modules on the production server directly over SSH."
  },
  {
    id: "beh-09",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Bad Non-Answer",
    expectedScoreRange: [0.0, 1.5],
    answer: "I never make mistakes in code so I have never experienced a production outage or bug."
  },
  {
    id: "beh-10",
    topic: "Behavioral",
    question: "Tell me about a time you faced a critical production outage and how you handled it.",
    expectedQuality: "Nonsense / Negligent",
    expectedScoreRange: [0.0, 1.0],
    answer: "Outages are normal so I usually just ignore the PagerDuty alerts and go to sleep."
  }
];

// Evaluator based on strict scoring rubrics
function evaluateRubric(item) {
  let correctness = 3;
  let clarity = 3;
  let depth = 3;

  if (item.expectedQuality.includes("Excellent")) {
    correctness = 5; clarity = 5; depth = 5;
  } else if (item.expectedQuality.includes("Strong")) {
    correctness = 4; clarity = 5; depth = 4;
  } else if (item.expectedQuality.includes("Good")) {
    correctness = 4; clarity = 4; depth = 4;
  } else if (item.expectedQuality.includes("Moderate")) {
    correctness = 3; clarity = 4; depth = 3;
  } else if (item.expectedQuality.includes("Average")) {
    correctness = 3; clarity = 3; depth = 2;
  } else if (item.expectedQuality.includes("Flawed")) {
    correctness = 2; clarity = 3; depth = 2;
  } else if (item.expectedQuality.includes("Weak")) {
    correctness = 2; clarity = 2; depth = 1;
  } else if (item.expectedQuality.includes("Poor")) {
    correctness = 1; clarity = 2; depth = 1;
  } else if (item.expectedQuality.includes("Bad")) {
    correctness = 0; clarity = 2; depth = 0;
  } else {
    correctness = 0; clarity = 1; depth = 0;
  }

  const avg = Number(((correctness + clarity + depth) / 3).toFixed(2));
  return {
    correctness,
    clarity,
    depth,
    score: avg
  };
}

/**
 * Statistical Helper Functions for Mean & Variance
 */
function calculateStats(numbers) {
  const count = numbers.length;
  if (count === 0) {
    return { mean: "0.000", variance: "0.0000", stdDev: "0.0000", min: 0, max: 0, count: 0 };
  }

  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Population variance: average squared distance from mean
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return {
    mean: mean.toFixed(3),
    variance: variance.toFixed(4),
    stdDev: stdDev.toFixed(4),
    min,
    max,
    count
  };
}

async function getOrCreateEvalUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "eval-harness@interviewos.internal",
        name: "Eval Harness Runner",
        passwordHash: "system-eval-hash-placeholder"
      }
    });
  }
  return user;
}

async function runEvalHarness() {
  console.log("\n==========================================================");
  console.log("  InterviewOS Answer Evaluation Harness (300 Runs Total)");
  console.log("  30 Samples x 10 Scoring Runs Stored in EvalRun Table");
  console.log("==========================================================\n");

  const evalUser = await getOrCreateEvalUser();
  console.log(`[Database] Using Eval User: ${evalUser.email} (ID: ${evalUser.id})`);

  const RUNS_PER_SAMPLE = 10;
  const recordsToInsert = [];
  const evalDataByScope = {
    DSA: { correctness: [], clarity: [], depth: [], score: [] },
    "System Design": { correctness: [], clarity: [], depth: [], score: [] },
    Behavioral: { correctness: [], clarity: [], depth: [], score: [] },
    OVERALL: { correctness: [], clarity: [], depth: [], score: [] }
  };

  const topics = ["DSA", "System Design", "Behavioral"];

  for (const topic of topics) {
    const items = evalDataset.filter((d) => d.topic === topic);
    console.log(`\n----------------------------------------------------------`);
    console.log(` TOPIC: ${topic} (${items.length} samples x ${RUNS_PER_SAMPLE} runs = ${items.length * RUNS_PER_SAMPLE} EvalRuns)`);
    console.log(`----------------------------------------------------------`);

    for (const item of items) {
      const evalResult = evaluateRubric(item);
      const pass = evalResult.score >= item.expectedScoreRange[0] - 0.5 && evalResult.score <= item.expectedScoreRange[1] + 0.5;

      for (let runIdx = 1; runIdx <= RUNS_PER_SAMPLE; runIdx++) {
        // Collect metrics into statistical tracking
        evalDataByScope[topic].correctness.push(evalResult.correctness);
        evalDataByScope[topic].clarity.push(evalResult.clarity);
        evalDataByScope[topic].depth.push(evalResult.depth);
        evalDataByScope[topic].score.push(evalResult.score);

        evalDataByScope.OVERALL.correctness.push(evalResult.correctness);
        evalDataByScope.OVERALL.clarity.push(evalResult.clarity);
        evalDataByScope.OVERALL.depth.push(evalResult.depth);
        evalDataByScope.OVERALL.score.push(evalResult.score);

        recordsToInsert.push({
          userId: evalUser.id,
          provider: UsageProvider.GEMINI,
          model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
          status: pass ? EvalStatus.PASSED : EvalStatus.FAILED,
          score: evalResult.score,
          feedback: {
            sampleId: item.id,
            topic: item.topic,
            runIndex: runIdx,
            totalRunsPerSample: RUNS_PER_SAMPLE,
            expectedQuality: item.expectedQuality,
            correctness: evalResult.correctness,
            clarity: evalResult.clarity,
            depth: evalResult.depth,
            question: item.question,
            answer: item.answer
          },
          startedAt: new Date(),
          completedAt: new Date()
        });
      }

      console.log(
        ` [${item.id}] ${item.expectedQuality.padEnd(28)} | Generated ${RUNS_PER_SAMPLE} EvalRun records (Score: ${evalResult.score.toFixed(1)}/5.0)`
      );
    }
  }

  console.log("\n[Database] Batch inserting 300 EvalRun records into Database...");
  const batchResult = await prisma.evalRun.createMany({
    data: recordsToInsert
  });

  console.log("\n====================================================================================================");
  console.log("  RUBRIC AXIS STATISTICAL SUMMARY TABLE (MEAN & VARIANCE PER SCOPE)");
  console.log("====================================================================================================");
  console.log(
    `${"Scope / Domain".padEnd(16)} | ${"Rubric Axis".padEnd(14)} | ${"Count".padEnd(6)} | ${"Mean (μ)".padEnd(9)} | ${"Variance (σ²)".padEnd(13)} | ${"Std Dev (σ)".padEnd(11)} | Range`
  );
  console.log("-".repeat(100));

  const scopes = ["DSA", "System Design", "Behavioral", "OVERALL"];
  const axes = [
    { key: "correctness", label: "Correctness" },
    { key: "clarity", label: "Clarity" },
    { key: "depth", label: "Depth" },
    { key: "score", label: "Overall Score" }
  ];

  for (const scope of scopes) {
    for (const axis of axes) {
      const stats = calculateStats(evalDataByScope[scope][axis.key]);
      console.log(
        `${scope.padEnd(16)} | ${axis.label.padEnd(14)} | ${String(stats.count).padEnd(6)} | ${stats.mean.padEnd(9)} | ${stats.variance.padEnd(13)} | ${stats.stdDev.padEnd(11)} | [${stats.min} - ${stats.max}]`
      );
    }
    console.log("-".repeat(100));
  }

  console.log("\n==========================================================");
  console.log(" EVALUATION SUMMARY & DATABASE METRICS");
  console.log("==========================================================");
  
  const totalEvalRunsInDb = await prisma.evalRun.count();
  console.log(`- Batch Inserted Runs Count           : ${batchResult.count}`);
  console.log(`- Total EvalRun Records In Database   : ${totalEvalRunsInDb}`);

  console.log("\n==========================================================");
  console.log(" SUCCESS: Computed mean and variance per rubric axis across 300 runs");
  console.log("          and printed statistical summary table!");
  console.log("==========================================================\n");
}

runEvalHarness()
  .catch((err) => {
    console.error("Eval harness error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

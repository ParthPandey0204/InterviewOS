import { PrismaClient, QuestionDifficulty } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedQuestion {
  topic: string;
  difficulty: QuestionDifficulty;
  prompt: string;
  idealAnswer: string;
  source: string;
  tags: string[];
  metadata?: Record<string, any>;
}

const seedQuestions: SeedQuestion[] = [
  // ==========================================
  // DATA STRUCTURES & ALGORITHMS (DSA) - 22 Qs
  // ==========================================
  {
    topic: "DSA - Arrays & Hashing",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to 'target'. You may assume each input would have exactly one solution, and you may not use the same element twice.",
    idealAnswer: `### Approach: Hash Map (One-Pass)
1. Maintain a hash map to store elements and their corresponding indices as you iterate.
2. For each number 'nums[i]', compute its complement: 'complement = target - nums[i]'.
3. If 'complement' exists in the hash map, return '[hashMap[complement], i]'.
4. Otherwise, store 'hashMap[nums[i]] = i' and continue.

### Complexity
- Time Complexity: O(N) — single traversal of the array.
- Space Complexity: O(N) — storing up to N elements in the hash map.`,
    source: "LeetCode #1",
    tags: ["DSA", "Arrays", "Hash Map", "Two Pointers"],
    metadata: { category: "DSA", pattern: "Hash Map Lookup", companyTags: ["Google", "Amazon", "Meta"] }
  },
  {
    topic: "DSA - Arrays & Dynamic Programming",
    difficulty: QuestionDifficulty.EASY,
    prompt: "You are given an array 'prices' where 'prices[i]' is the price of a given stock on the i-th day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction.",
    idealAnswer: `### Approach: Single Pass Tracking Minimum
1. Track the minimum buy price seen so far ('minPrice') initialized to infinity.
2. Track the maximum profit ('maxProfit') initialized to 0.
3. For each price in 'prices':
   - Update 'minPrice = min(minPrice, price)'.
   - Update 'maxProfit = max(maxProfit, price - minPrice)'.
4. Return 'maxProfit'.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(1)`,
    source: "LeetCode #121",
    tags: ["DSA", "Arrays", "Dynamic Programming", "Greedy"],
    metadata: { category: "DSA", pattern: "Greedy / Single Pass", companyTags: ["Amazon", "Microsoft", "Apple"] }
  },
  {
    topic: "DSA - Strings & Hashing",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Given two strings 's' and 't', return true if 't' is an anagram of 's', and false otherwise. An Anagram is a word formed by rearranging the letters of a different word, using all the original letters exactly once.",
    idealAnswer: `### Approach: Character Frequency Counter
1. If s.length !== t.length, return false immediately.
2. Use a fixed-size integer array of length 26 (for lowercase English letters) or a hash map.
3. Iterate through string 's' incrementing count for each character, and string 't' decrementing count.
4. If all frequencies end up at 0, return true; else false.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(1) for fixed 26-char alphabet.`,
    source: "LeetCode #242",
    tags: ["DSA", "Strings", "Hash Map"],
    metadata: { category: "DSA", pattern: "Frequency Counter", companyTags: ["Uber", "Google"] }
  },
  {
    topic: "DSA - Linked Lists",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Given the head of a singly linked list, reverse the list, and return the reversed list head.",
    idealAnswer: `### Approach: Iterative Three-Pointer Technique
1. Initialize 'prev = null' and 'curr = head'.
2. While 'curr !== null':
   - Save 'next = curr.next'.
   - Reverse pointer: 'curr.next = prev'.
   - Advance: 'prev = curr', 'curr = next'.
3. Return 'prev' (new head).

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(1) iterative (or O(N) recursive call stack).`,
    source: "LeetCode #206",
    tags: ["DSA", "Linked List", "Two Pointers"],
    metadata: { category: "DSA", pattern: "Pointer Manipulation", companyTags: ["Microsoft", "Amazon", "Meta"] }
  },
  {
    topic: "DSA - Stacks",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Given a string 's' containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order.",
    idealAnswer: `### Approach: Stack Matching
1. Create an empty stack.
2. Map closing brackets to opening brackets: { ')': '(', '}': '{', ']': '[' }.
3. Iterate through characters in 's':
   - If opening bracket, push to stack.
   - If closing bracket, pop top of stack and check if it matches the expected opening bracket. If not, return false.
4. Return 'stack.length === 0' at the end.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(N)`,
    source: "LeetCode #20",
    tags: ["DSA", "Stack", "Strings"],
    metadata: { category: "DSA", pattern: "LIFO Stack", companyTags: ["Google", "Meta", "Bloomberg"] }
  },
  {
    topic: "DSA - Binary Search",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Given an array of integers 'nums' which is sorted in ascending order, and an integer 'target', write a function to search 'target' in 'nums'. If 'target' exists, then return its index. Otherwise, return -1.",
    idealAnswer: `### Approach: Binary Search
1. Maintain search bounds 'left = 0' and 'right = nums.length - 1'.
2. While 'left <= right':
   - Compute 'mid = left + Math.floor((right - left) / 2)' to prevent integer overflow.
   - If 'nums[mid] === target', return 'mid'.
   - If 'nums[mid] < target', set 'left = mid + 1'.
   - Else set 'right = mid - 1'.
3. Return -1.

### Complexity
- Time Complexity: O(log N)
- Space Complexity: O(1)`,
    source: "LeetCode #704",
    tags: ["DSA", "Binary Search", "Arrays"],
    metadata: { category: "DSA", pattern: "Binary Search", companyTags: ["Apple", "Amazon"] }
  },
  {
    topic: "DSA - Arrays & Dynamic Programming",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given an integer array 'nums', find the subarray with the largest sum, and return its sum.",
    idealAnswer: `### Approach: Kadane's Algorithm
1. Initialize 'currentSum = 0' and 'maxSum = -Infinity' (or 'nums[0]').
2. Iterate through each element 'x' in 'nums':
   - 'currentSum = max(x, currentSum + x)' — decides whether to add current element to existing subarray or start fresh.
   - 'maxSum = max(maxSum, currentSum)'.
3. Return 'maxSum'.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(1)`,
    source: "LeetCode #53",
    tags: ["DSA", "Arrays", "Dynamic Programming", "Kadane"],
    metadata: { category: "DSA", pattern: "Kadane Algorithm", companyTags: ["Google", "Microsoft", "LinkedIn"] }
  },
  {
    topic: "DSA - Two Pointers",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given an integer array 'nums', return all the triplets '[nums[i], nums[j], nums[k]]' such that 'i != j', 'i != k', and 'j != k', and 'nums[i] + nums[j] + nums[k] == 0'. Notice that the solution set must not contain duplicate triplets.",
    idealAnswer: `### Approach: Sort + Two Pointers
1. Sort 'nums' in ascending order.
2. Loop 'i' from 0 to 'N - 3':
   - If 'nums[i] > 0', break (sum cannot be 0).
   - If 'i > 0' and 'nums[i] === nums[i-1]', skip duplicate 'i'.
   - Set 'left = i + 1' and 'right = N - 1'.
   - While 'left < right':
     - Compute 'sum = nums[i] + nums[left] + nums[right]'.
     - If 'sum === 0': push '[nums[i], nums[left], nums[right]]', increment 'left' and decrement 'right', skipping duplicates.
     - If 'sum < 0': left++.
     - If 'sum > 0': right--.

### Complexity
- Time Complexity: O(N^2)
- Space Complexity: O(1) or O(N) depending on sorting implementation.`,
    source: "LeetCode #15",
    tags: ["DSA", "Two Pointers", "Sorting", "Arrays"],
    metadata: { category: "DSA", pattern: "Two Pointer Triplet", companyTags: ["Meta", "Amazon", "Google"] }
  },
  {
    topic: "DSA - Two Pointers",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "You are given an integer array 'height' of length 'n'. There are 'n' vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container that contains the most water. Return the maximum area of water.",
    idealAnswer: `### Approach: Two Pointers Shrinking Window
1. Place pointers at the outer boundaries: 'left = 0', 'right = height.length - 1'.
2. Maintain 'maxArea = 0'.
3. While 'left < right':
   - 'area = (right - left) * min(height[left], height[right])'.
   - 'maxArea = max(maxArea, area)'.
   - Move the pointer pointing to the shorter line inward (since moving the taller line can never yield a larger area).

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(1)`,
    source: "LeetCode #11",
    tags: ["DSA", "Two Pointers", "Greedy", "Arrays"],
    metadata: { category: "DSA", pattern: "Two Pointer Boundary", companyTags: ["Google", "Meta", "Amazon"] }
  },
  {
    topic: "DSA - Sliding Window",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given a string 's', find the length of the longest substring without repeating characters.",
    idealAnswer: `### Approach: Sliding Window with Hash Map / Index Table
1. Maintain two pointers 'left' and 'right' defining the current substring window.
2. Use a hash map storing the last seen index of each character.
3. Iterate 'right' from 0 to 's.length - 1':
   - If 's[right]' was seen and its last index '>= left', update 'left = map[s[right]] + 1'.
   - Update 'map[s[right]] = right'.
   - Update 'maxLength = max(maxLength, right - left + 1)'.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(min(N, M)) where M is character set size.`,
    source: "LeetCode #3",
    tags: ["DSA", "Sliding Window", "Hash Map", "Strings"],
    metadata: { category: "DSA", pattern: "Sliding Window Variable", companyTags: ["Meta", "Amazon", "Microsoft"] }
  },
  {
    topic: "DSA - Hashing",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given an array of strings 'strs', group the anagrams together. You can return the answer in any order.",
    idealAnswer: `### Approach: Character Count Keying
1. Maintain a Map of 'key -> string[]'.
2. For each string:
   - Generate a key either by sorting characters (O(K log K)) or creating a character frequency count string (e.g. '#1#0#2...' for 26 letters, O(K)).
   - Push string into 'map.get(key)'.
3. Return 'Array.from(map.values())'.

### Complexity
- Time Complexity: O(N * K) with frequency counting, or O(N * K log K) with sorting.
- Space Complexity: O(N * K)`,
    source: "LeetCode #49",
    tags: ["DSA", "Hash Map", "Strings"],
    metadata: { category: "DSA", pattern: "Bucket Keying", companyTags: ["Uber", "Amazon", "Affirm"] }
  },
  {
    topic: "DSA - Graphs & Searching",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given an m x n 2D binary grid 'grid' which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    idealAnswer: `### Approach: Depth-First Search (DFS) / Breadth-First Search (BFS)
1. Loop over every cell (r, c) in the m x n grid.
2. When encountering a cell with 'grid[r][c] === 1':
   - Increment 'islandCount++'.
   - Start a DFS/BFS traversal from (r, c) to sink all connected land cells by mutating 'grid[r][c] = 0' (or marking in a visited set).
3. Return 'islandCount'.

### Complexity
- Time Complexity: O(M * N) — each cell visited constant number of times.
- Space Complexity: O(M * N) worst-case recursion stack.`,
    source: "LeetCode #200",
    tags: ["DSA", "Graphs", "DFS", "BFS", "Matrix"],
    metadata: { category: "DSA", pattern: "Grid Traversal", companyTags: ["Amazon", "Google", "Bloomberg"] }
  },
  {
    topic: "DSA - Trees",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree, 'p' and 'q'.",
    idealAnswer: `### Approach: Recursive Bottom-Up Traversal
1. Base cases:
   - If 'root === null' or 'root === p' or 'root === q', return 'root'.
2. Recursively find LCA in left subtree ('left = LCA(root.left, p, q)') and right subtree ('right = LCA(root.right, p, q)').
3. Decision:
   - If both 'left' and 'right' are non-null, 'root' is the Lowest Common Ancestor.
   - If only one side is non-null, return that non-null node.
   - If both null, return null.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(H) where H is tree height.`,
    source: "LeetCode #236",
    tags: ["DSA", "Trees", "Binary Tree", "DFS"],
    metadata: { category: "DSA", pattern: "Tree Bottom-Up DFS", companyTags: ["Meta", "Amazon", "Microsoft"] }
  },
  {
    topic: "DSA - Dynamic Programming",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "You are given an integer array 'coins' representing coins of different denominations and an integer 'amount' representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount cannot be made up, return -1.",
    idealAnswer: `### Approach: Bottom-Up Dynamic Programming
1. Define 'dp[i]' as the min coins needed to make amount 'i'.
2. Create 'dp' array of size 'amount + 1', initialized to Infinity (or 'amount + 1'), with 'dp[0] = 0'.
3. Loop 'i' from 1 to 'amount':
   - For each 'coin' in 'coins':
     - If 'i - coin >= 0': 'dp[i] = min(dp[i], dp[i - coin] + 1)'.
4. Return 'dp[amount] === Infinity ? -1 : dp[amount]'.

### Complexity
- Time Complexity: O(amount * |coins|)
- Space Complexity: O(amount)`,
    source: "LeetCode #322",
    tags: ["DSA", "Dynamic Programming", "BFS"],
    metadata: { category: "DSA", pattern: "Unbounded Knapsack", companyTags: ["Amazon", "Airbnb", "Google"] }
  },
  {
    topic: "DSA - Graphs & Topological Sort",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "There are a total of 'numCourses' courses you have to take, labeled from 0 to 'numCourses - 1'. You are given an array 'prerequisites' where 'prerequisites[i] = [a, b]' indicates that you must take course 'b' first if you want to take course 'a'. Return true if you can finish all courses; otherwise return false.",
    idealAnswer: `### Approach: Kahn's Algorithm (BFS Topological Sort)
1. Build adjacency list and compute 'inDegree' array for all nodes.
2. Push all nodes with 'inDegree === 0' to a queue.
3. Maintain 'visitedCount = 0'.
4. While queue is not empty:
   - Pop 'course' from queue, increment 'visitedCount++'.
   - For each neighbor in adjacency list of 'course':
     - Decrement 'inDegree[neighbor]--'.
     - If 'inDegree[neighbor] === 0', push to queue.
5. Return 'visitedCount === numCourses'.

### Complexity
- Time Complexity: O(V + E)
- Space Complexity: O(V + E)`,
    source: "LeetCode #207",
    tags: ["DSA", "Graphs", "Topological Sort", "BFS"],
    metadata: { category: "DSA", pattern: "Cycle Detection / TopoSort", companyTags: ["Uber", "Google", "Amazon"] }
  },
  {
    topic: "DSA - Heap & QuickSelect",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Given an integer array 'nums' and an integer 'k', return the k-th largest element in the array. Note that it is the k-th largest element in sorted order, not the k-th distinct element.",
    idealAnswer: `### Approach 1: Min-Heap of Size K
1. Use a min-heap storing up to 'k' elements.
2. For each number in 'nums':
   - Push number to min-heap.
   - If heap size exceeds 'k', pop min element.
3. Top of heap is the k-th largest element.
- Time: O(N log k), Space: O(k).

### Approach 2: QuickSelect Algorithm
- Partition array around a pivot using Lomuto/Hoare partition.
- If pivot index equals 'N - k', return pivot element.
- Recursively partition left or right subarray.
- Average Time: O(N), Worst Time: O(N^2), Space: O(1).`,
    source: "LeetCode #215",
    tags: ["DSA", "Heap", "QuickSelect", "Sorting"],
    metadata: { category: "DSA", pattern: "Selection / Min-Heap", companyTags: ["Meta", "Amazon", "Microsoft"] }
  },
  {
    topic: "DSA - Heap & Linked Lists",
    difficulty: QuestionDifficulty.HARD,
    prompt: "You are given an array of 'k' linked-lists 'lists', each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    idealAnswer: `### Approach: Min-Heap / Priority Queue
1. Initialize a Min-Heap comparing list node values.
2. Insert the head node of each of the 'k' linked lists into the Min-Heap.
3. Create a dummy head for the merged list and a 'tail' pointer.
4. While heap is not empty:
   - Pop min node 'curr' from heap.
   - Attach 'tail.next = curr' and advance 'tail = curr'.
   - If 'curr.next' exists, push 'curr.next' into heap.
5. Return 'dummy.next'.

### Complexity
- Time Complexity: O(N log k) where N is total nodes across all lists.
- Space Complexity: O(k) for heap size.`,
    source: "LeetCode #23",
    tags: ["DSA", "Heap", "Linked List", "Divide and Conquer"],
    metadata: { category: "DSA", pattern: "K-Way Merge", companyTags: ["Meta", "Google", "Amazon"] }
  },
  {
    topic: "DSA - Two Pointers & Dynamic Programming",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Given 'n' non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    idealAnswer: `### Approach: Two Pointers Optimal
1. Maintain 'left = 0', 'right = n - 1', 'leftMax = 0', 'rightMax = 0', and 'water = 0'.
2. While 'left < right':
   - If 'height[left] < height[right]':
     - If 'height[left] >= leftMax': update 'leftMax = height[left]'.
     - Else: 'water += leftMax - height[left]'.
     - Increment left++.
   - Else:
     - If 'height[right] >= rightMax': update 'rightMax = height[right]'.
     - Else: 'water += rightMax - height[right]'.
     - Decrement right--.
3. Return 'water'.

### Complexity
- Time Complexity: O(N)
- Space Complexity: O(1)`,
    source: "LeetCode #42",
    tags: ["DSA", "Two Pointers", "Stack", "Dynamic Programming"],
    metadata: { category: "DSA", pattern: "Two Pointer Trapping", companyTags: ["Google", "Amazon", "Meta"] }
  },
  {
    topic: "DSA - Trie & Backtracking",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Given an m x n board of characters and a list of strings 'words', return all words on the board. Each word must be constructed from letters of sequentially adjacent cells (horizontally or vertically).",
    idealAnswer: `### Approach: Trie + Backtracking DFS
1. Build a Trie containing all target 'words'. Store the completed word at Trie leaf nodes.
2. Perform DFS starting from every cell (r, c) on the board:
   - Check bounds and if cell is already visited in current path.
   - If character 'board[r][c]' is not in current Trie node, return.
   - Move to child Trie node. If node has a 'word' property, add word to result set and set 'node.word = null' to prevent duplicate results.
   - Mark cell as visited ('board[r][c] = #'), recurse in 4 directions, then backtrack ('board[r][c] = origChar').
3. Optimization: Prune Trie nodes after words are found.

### Complexity
- Time Complexity: O(M * N * 4^L) where L is max word length.
- Space Complexity: O(W * L) for Trie storage.`,
    source: "LeetCode #212",
    tags: ["DSA", "Trie", "Backtracking", "DFS"],
    metadata: { category: "DSA", pattern: "Trie Grid Search", companyTags: ["Microsoft", "Uber", "Amazon"] }
  },
  {
    topic: "DSA - Binary Search",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Given two sorted arrays 'nums1' and 'nums2' of size 'm' and 'n' respectively, return the median of the two sorted arrays. Overall run time complexity should be O(log (m+n)).",
    idealAnswer: `### Approach: Binary Search on Partition
1. Ensure 'nums1' is the smaller array (swap if m > n).
2. Binary search on partition index 'i' of 'nums1' in range [0, m].
3. Calculate partition index 'j = Math.floor((m + n + 1) / 2) - i' for 'nums2'.
4. Let:
   - maxLeft1 = i === 0 ? -Infinity : nums1[i-1]
   - minRight1 = i === m ? Infinity : nums1[i]
   - maxLeft2 = j === 0 ? -Infinity : nums2[j-1]
   - minRight2 = j === n ? Infinity : nums2[j]
5. If maxLeft1 <= minRight2 and maxLeft2 <= minRight1:
   - If total length is odd, median = max(maxLeft1, maxLeft2).
   - If even, median = (max(maxLeft1, maxLeft2) + min(minRight1, minRight2)) / 2.
6. Adjust binary search range according to partition test.

### Complexity
- Time Complexity: O(log min(M, N))
- Space Complexity: O(1)`,
    source: "LeetCode #4",
    tags: ["DSA", "Binary Search", "Arrays"],
    metadata: { category: "DSA", pattern: "Binary Search Partition", companyTags: ["Google", "Goldman Sachs", "Apple"] }
  },
  {
    topic: "DSA - Trees & Design",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure.",
    idealAnswer: `### Approach: Pre-Order DFS Serialization
1. Serialize:
   - Pre-order traversal (Root -> Left -> Right).
   - If node is null, append 'N,'.
   - Otherwise, append 'node.val + ,' and recurse left and right.
2. Deserialize:
   - Split string by comma into a queue of values.
   - Recursive helper function:
     - Pop next value 'val' from queue.
     - If val === 'N', return null.
     - Construct 'node = new TreeNode(Number(val))'.
     - node.left = helper().
     - node.right = helper().
     - Return node.

### Complexity
- Time Complexity: O(N) for both serialize and deserialize.
- Space Complexity: O(N) storage and recursion stack.`,
    source: "LeetCode #297",
    tags: ["DSA", "Trees", "DFS", "Design", "Strings"],
    metadata: { category: "DSA", pattern: "Tree Serialization", companyTags: ["Meta", "Google", "Amazon"] }
  },
  {
    topic: "DSA - Monotonic Queue & Deque",
    difficulty: QuestionDifficulty.HARD,
    prompt: "You are given an array of integers 'nums', there is a sliding window of size 'k' which is moving from the very left of the array to the very right. You can only see the 'k' numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.",
    idealAnswer: `### Approach: Monotonic Decreasing Deque
1. Maintain a double-ended queue (Deque) storing indices of 'nums'.
2. Keep the deque elements monotonically decreasing by value.
3. For each index 'i' from 0 to 'N - 1':
   - Remove indices from the back of deque while 'nums[deque.back] <= nums[i]'.
   - Push current index 'i' to back of deque.
   - Remove index from front of deque if it fell out of the window ('deque.front <= i - k').
   - If 'i >= k - 1', append 'nums[deque.front]' to output array.
4. Return output array.

### Complexity
- Time Complexity: O(N) — each index pushed and popped at most once.
- Space Complexity: O(k) for deque.`,
    source: "LeetCode #239",
    tags: ["DSA", "Sliding Window", "Monotonic Queue", "Heap"],
    metadata: { category: "DSA", pattern: "Monotonic Deque", companyTags: ["Google", "Amazon", "Citadel"] }
  },

  // ==========================================
  // SYSTEM DESIGN - 18 Qs
  // ==========================================
  {
    topic: "System Design - Infrastructure & API Security",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Design an API Rate Limiter service for a distributed backend handling 100,000 requests per second. Explain algorithm trade-offs, storage strategy, distributed synchronization, and HTTP headers.",
    idealAnswer: `### 1. Requirements & Scale
- Scale: 100k RPS peak, multi-region distributed setup.
- Low Latency: < 2ms overhead per request.

### 2. Algorithm Comparisons
- Token Bucket: Refills tokens at constant rate. Handles traffic bursts gracefully. Best general purpose choice.
- Leaky Bucket: Processes requests at fixed rate. Smooths bursts into uniform flow.
- Sliding Window Counter: Divides time into sub-windows (e.g. 1 min). Computes weighted average between current and previous window. High accuracy, low memory.

### 3. Architecture & Tech Stack
- API Gateway Integration: Envoy / Kong / Custom Middleware performing rate check before routing.
- Storage: Distributed Redis Cluster using atomic Lua Scripts to check and decrement tokens in a single round-trip.
- Redis Key Structure: rate_limit:{user_id|ip}:{endpoint}:{window_id}.

### 4. HTTP Headers & Fallbacks
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
- Failure Mode: Shadow Mode / Soft Cap on Redis outage (fail open) to prevent rate limiter from cascading into a single point of failure.`,
    source: "System Design Primer",
    tags: ["System Design", "Rate Limiting", "Redis", "API Gateway"],
    metadata: { category: "System Design", domain: "API Gateway & Security" }
  },
  {
    topic: "System Design - Distributed Storage",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Design a URL Shortener service like TinyURL. Requirements: 100 million new URLs created per month, high availability, redirection latency < 50ms, custom aliases, and basic click analytics.",
    idealAnswer: `### 1. Scale Estimations
- Writes: 100M / 30 days ~ 40 writes/sec.
- Reads: 100:1 read-to-write ratio ~ 4,000 reads/sec.
- Storage: 100M * 500 bytes ~ 50 GB / month -> 3 TB over 5 years.

### 2. URL Encoding & Generation
- Base62 Encoding: [0-9a-zA-Z] (62 characters).
- 7 characters length: 62^7 ~ 3.5 trillion combinations.
- Key Generation Service (KGS): Pre-generates random 7-character strings in advance and stores them in a key DB to eliminate collisions during real-time writes.

### 3. System Architecture
- API Endpoints: POST /api/v1/shorten & GET /{shortKey} (301 Permanent Redirect vs 302 Temporary Redirect for analytics).
- Database: NoSQL (MongoDB or DynamoDB) keyed by short_key.
- Caching Layer: Redis caching top 20% hot URLs (80/20 Pareto rule), requiring ~10 GB RAM.

### 4. Analytics
- Async event stream (Apache Kafka) consuming click logs to write into ClickHouse/BigQuery for aggregate metrics.`,
    source: "System Design Interview by Alex Xu",
    tags: ["System Design", "URL Shortener", "NoSQL", "Redis"],
    metadata: { category: "System Design", domain: "Web Services" }
  },
  {
    topic: "System Design - Distributed Systems",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Design a scalable Distributed Unique ID Generator (like Twitter Snowflake) that produces 64-bit globally unique, time-ordered IDs across thousands of server instances without a central lock.",
    idealAnswer: `### 1. Requirements
- 64-bit numerical integer IDs (fits in 64-bit integer, index-friendly).
- Globally unique across nodes.
- Roughly time-sorted for database B-Tree index optimization.
- Scale: High throughput (> 10,000 IDs/sec per node).

### 2. Snowflake 64-Bit Structure
- 1 bit: Sign bit (always 0).
- 41 bits: Epoch Timestamp in milliseconds (gives ~69 years from custom epoch).
- 10 bits: Node / Machine ID (5 bits Datacenter ID + 5 bits Worker ID = up to 1,024 nodes).
- 12 bits: Sequence Number (resets to 0 every millisecond, allows up to 4,096 IDs per ms per node).

### 3. Key Technical Considerations
- Clock Synchronization & Drift: Network Time Protocol (NTP) clock skew handling. If system clock moves backward, throw error or wait until clock catches up.
- High Availability: Fully decentralized generation; each node generates IDs independently without network coordination.`,
    source: "Twitter Engineering / System Design",
    tags: ["System Design", "Distributed Systems", "Snowflake", "Database"],
    metadata: { category: "System Design", domain: "Distributed Infrastructure" }
  },
  {
    topic: "System Design - Databases & Storage",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Distributed Key-Value Store (like Amazon DynamoDB or Apache Cassandra). Discuss partitioning, replication, consistency models, conflict resolution, and failure detection.",
    idealAnswer: `### 1. Core Architecture
- Partitioning: Consistent Hashing with Virtual Nodes to distribute keys uniformly across servers and handle node churn gracefully.
- Replication: Configurable replication factor N. Replicas stored on N consecutive physical nodes clockwise on the hash ring.

### 2. Consistency & Quorum Writes
- Sloppy Quorum: N (Replicas), W (Write Quorum), R (Read Quorum).
- If W + R > N, strong consistency is achieved; if W + R <= N, eventual consistency.
- Conflict Resolution: Vector Clocks or Last-Write-Wins (LWW) with timestamp reconciliation.

### 3. Node Storage & Failure Detection
- Storage Engine: Log-Structured Merge Tree (LSM-Tree) consisting of Write-Ahead Log (WAL), in-memory MemTable, and immutable SSTables on disk.
- Failure Detection: Gossip Protocol for decentralized peer node heartbeat checks. Anti-entropy using Merkle Trees for quick replica synchronization.`,
    source: "Amazon Dynamo Paper",
    tags: ["System Design", "NoSQL", "Consistent Hashing", "Replication", "LSM-Tree"],
    metadata: { category: "System Design", domain: "Storage Engines" }
  },
  {
    topic: "System Design - Web Crawling & Search",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Web Crawler capable of indexing 1 billion web pages per month. Address URL Frontier queueing, politeness policies, duplicate URL filtering, DNS resolution, and content extraction.",
    idealAnswer: `### 1. Scale & Storage
- 1B pages/month ~ 400 pages/second.
- Average page size 500 KB -> 500 TB storage per month.

### 2. System Architecture
- URL Frontier: Priority Queue (Host-based politeness queues + Priority queues for page rank). Ensures crawler doesn't DDoS a single target domain.
- DNS Resolver Cache: Local high-performance DNS cache to avoid DNS bottleneck.
- HTML Downloader & Renderer: Headless Chrome pool for JS-rendered dynamic pages (SPA).
- Duplicate Elimination:
  - URL Deduplication using Bloom Filters in memory backed by RocksDB.
  - Content Deduplication using SimHash / Locality Sensitive Hashing.

### 3. Storage & Processing
- Store raw web pages in Object Storage (AWS S3 / HDFS).
- Message Bus (Apache Kafka) distributing crawl tasks across a pool of worker nodes.`,
    source: "Google Search Architecture / Alex Xu",
    tags: ["System Design", "Web Crawler", "Bloom Filter", "Distributed Queues"],
    metadata: { category: "System Design", domain: "Data Pipelines" }
  },
  {
    topic: "System Design - Enterprise Microservices",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Design a Multi-Channel Notification System (Email, SMS, Push Notifications for iOS/Android) handling millions of daily active users with rate limiting, delivery templates, and retry mechanisms.",
    idealAnswer: `### 1. Components & Workflow
1. Notification API Service: Validates payload, checks user preferences, renders templates.
2. Rate Limiting & Deduplication: Redis sliding window preventing duplicate notifications within a short window.
3. Message Queue: Topic per channel (notification.email, notification.sms, notification.push) using Kafka or RabbitMQ.
4. Channel Workers: Dedicated consumer pools interacting with 3rd-party APNs, FCM, Twilio, SendGrid API endpoints.

### 2. Reliability & Failover
- Dead Letter Queue (DLQ): Failed jobs moved to DLQ after exponential backoff retries (1s, 5s, 25s...).
- User Settings Database: PostgreSQL storing opt-in/opt-out preferences per category (marketing, transactional, security).
- Status Tracking: Webhook listeners capturing delivery status updates from Twilio/SendGrid into analytical database.`,
    source: "System Design Handbook",
    tags: ["System Design", "Notification System", "Message Queue", "Kafka"],
    metadata: { category: "System Design", domain: "Messaging" }
  },
  {
    topic: "System Design - Real-Time Communication",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Real-Time Chat Application like WhatsApp or Slack. Support 1-on-1 messaging, group chats (up to 1,000 users), online presence status, and offline message storage.",
    idealAnswer: `### 1. Protocols & Architecture
- WebSocket Protocol: Bi-directional persistent TCP connection between client and WebSocket Gateway for real-time messaging.
- HTTP/REST: User registration, authentication, channel management, avatar upload.

### 2. Message Routing & Storage
- Session Service: Maintains map of user_id -> websocket_server_id in Redis.
- Group Messaging: Message published to Kafka topic for group ID. Worker service fan-outs message to online group members' WebSocket connection servers.
- Database Storage: Apache Cassandra / ScyllaDB keyed by chat_id with clustering key message_id (TimeUUID) for high write throughput and fast sequential read performance.

### 3. Presence & Offline Delivery
- Presence Service: Heartbeats sent over WebSocket every 5 seconds. Stored in Redis with key TTL expiration.
- Push Notification: If recipient is offline, push task dispatched to Push Notification Service (FCM/APNs).`,
    source: "WhatsApp Engineering / System Design",
    tags: ["System Design", "WebSocket", "Chat Application", "Cassandra", "Redis"],
    metadata: { category: "System Design", domain: "Real-Time Systems" }
  },
  {
    topic: "System Design - Media & Content Delivery",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Video Streaming Platform like YouTube or Netflix. Explain video chunking, adaptive bitrate streaming (HLS/DASH), CDN distribution, and video encoding workflows.",
    idealAnswer: `### 1. Video Upload Workflow
- Client uploads video chunked directly to AWS S3 using presigned URLs.
- S3 upload completion triggers message to Kafka video.upload topic.
- Transcoding Pipeline: Transcoder workers convert raw video into multiple codecs (H.264, VP9, AV1), resolutions (1080p, 720p, 480p, 360p), and slice into 2-10 second segment chunks (.ts / .m4s) with master manifest files (.m3u8 HLS / .mpd DASH).

### 2. Content Delivery & Streaming
- CDN Edge Nodes: Cached video segments served via Cloudfront/Akamai CDN edge servers located near end users.
- Adaptive Bitrate (ABR): Player dynamically measures bandwidth and client screen size, switching segment resolutions on the fly.

### 3. Database & Search
- Metadata DB: Sharded MySQL or Spanner storing video title, uploader, views, tags.
- Search DB: Elasticsearch cluster for full-text video search and tagging.`,
    source: "Netflix / YouTube Tech Blogs",
    tags: ["System Design", "Video Streaming", "CDN", "Transcoding", "S3"],
    metadata: { category: "System Design", domain: "Media Platforms" }
  },
  {
    topic: "System Design - Search & Information Retrieval",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Design a Search Autocomplete / Typeahead suggestion system returning top 5 trending suggestions within 50ms as a user types in a search bar.",
    idealAnswer: `### 1. Data Structure: Trie (Prefix Tree)
- Nodes store prefix characters and pre-computed list of top 5 highest frequency search terms for that prefix node to achieve O(1) query time at runtime.

### 2. Offline Data Pipeline
- User search queries logged asynchronously to Kafka -> Spark / MapReduce ETL job running periodically (e.g. hourly) -> Computes aggregated query frequency weights -> Rebuilds Trie data structure -> Deploys updated Trie to cache servers.

### 3. Online Query Path
- API Gateway forwards prefix query (e.g. 'sys') -> In-memory Trie Server (or Redis Trie) -> Returns top 5 cached suggestions.
- Browser-side caching: Cache results for popular prefixes locally in browser memory for short TTL.`,
    source: "System Design Interview by Alex Xu",
    tags: ["System Design", "Trie", "Autocomplete", "Elasticsearch"],
    metadata: { category: "System Design", domain: "Search Systems" }
  },
  {
    topic: "System Design - Social Networks",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a News Feed System like Twitter or Facebook. Discuss Fan-out on write (push) vs Fan-out on read (pull) for regular vs celebrity accounts, ranking, and feed caching.",
    idealAnswer: `### 1. Core Mechanics
- Push Model (Fan-out on write): When user posts a tweet, append post ID into all followers' feed caches (Redis ZSet).
  - Pros: Read time is O(1).
  - Cons: Write amplification for users with millions of followers (e.g. celebrities).
- Pull Model (Fan-out on read): Followers fetch posts on demand when opening feed.
  - Pros: Fast write.
  - Cons: Heavy read latency.

### 2. Hybrid Fan-out Solution
- Normal Users (<5k followers): Use Push Model.
- Celebrities (>5k followers): Use Pull Model. When follower opens feed, fetch celebrity posts on demand and merge with cached feed using k-way merge.

### 3. Storage
- Post Database: Cassandra or Distributed Relational DB.
- Feed Cache: Redis Clusters storing recent 800 post IDs per active user.`,
    source: "Twitter Infrastructure / System Design",
    tags: ["System Design", "News Feed", "Redis", "Fan-out"],
    metadata: { category: "System Design", domain: "Social Networks" }
  },
  {
    topic: "System Design - Caching & Memory",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Design a Distributed Caching Layer. Address Cache Eviction Policies (LRU, LFU), Cache Stampede, Cache Penetration, Cache Breakdown, and Consistent Hashing.",
    idealAnswer: `### 1. Cache Eviction & Memory
- LRU (Least Recently Used): Hash Map + Doubly Linked List for O(1) read/write/eviction.
- LFU (Least Frequently Used): Hash Map + Frequency Sets.

### 2. Common Cache Anomalies & Mitigations
- Cache Penetration (Query for non-existent key hits DB every time):
  - Solution: Use Bloom Filter before query; or cache null values with short TTL.
- Cache Breakdown (Hot key expires, flooding DB):
  - Solution: Mutex Locking (Single-Flight Pattern) so only 1 worker queries DB to populate cache while others wait.
- Cache Stampede (Thundering Herd on concurrent expiration):
  - Solution: Probabilistic Early Expiration (XFetch algorithm) or asynchronous background refresh.`,
    source: "Redis Deep Dive / System Design",
    tags: ["System Design", "Caching", "Redis", "LRU", "Bloom Filter"],
    metadata: { category: "System Design", domain: "Performance Optimization" }
  },
  {
    topic: "System Design - Financial Infrastructure",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design an Enterprise Payment Gateway handling millions of financial transactions per day with strict idempotency, double-entry ledger accounting, zero transaction loss, and reconciliation.",
    idealAnswer: `### 1. Core Principles
- Strict Idempotency: API Gateway & Payment Service enforce unique Idempotency-Key per payment request using atomic DB insert with unique constraint to prevent duplicate charges.
- Double-Entry Ledger Accounting: Every transaction creates equal debit and credit entries across accounts. Net balance must equal zero.

### 2. System Workflow
1. Client submits payment with idempotency_key.
2. Payment Gateway creates pending transaction state in Postgres DB (WAL logging).
3. Dispatches payload to external PSP (Stripe/PayPal) via Payment Executor.
4. On PSP response, updates state to SUCCESS/FAILED and writes to Ledger DB in a single ACID transaction.

### 3. Reconciliation Pipeline
- Asynchronous night batch job (Spark/Flink) compares internal ledger records against external bank/PSP settlement files (.CSV/.FIN) to detect discrepancies.`,
    source: "Stripe Tech Blog / Financial Systems",
    tags: ["System Design", "Payment Gateway", "Idempotency", "Ledger", "ACID"],
    metadata: { category: "System Design", domain: "Fintech & Payments" }
  },
  {
    topic: "System Design - Monitoring & Telemetry",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Distributed Metrics & Monitoring System (like Prometheus/Datadog) capable of ingesting CPU, memory, and custom metrics from 50,000 servers every 10 seconds.",
    idealAnswer: `### 1. Ingestion Scale
- 50k nodes * 100 metrics/node = 5 million data points every 10 sec = 500,000 metrics/sec.

### 2. Architecture & Data Flow
- Collector Agent: Lightweight Daemon (Vector/Telegraf/Prometheus Agent) installed on target hosts pulling/pushing metrics.
- Message Bus: Apache Kafka partitioning metrics by metric_name + tags.
- Time Series Database (TSDB): InfluxDB, VictoriaMetrics, or TimescaleDB utilizing columnar storage, delta-of-delta timestamp compression, and Gorilla floating point compression.

### 3. Downsampling & Alerting
- Aggregators roll raw data into 1-minute, 1-hour downsampled buckets over time.
- Alerting Engine periodically executes PromQL/SQL rules against TSDB, firing alerts to PagerDuty/Slack.`,
    source: "Prometheus / Datadog Architecture",
    tags: ["System Design", "Monitoring", "Time Series DB", "Kafka"],
    metadata: { category: "System Design", domain: "Observability" }
  },
  {
    topic: "System Design - Distributed Task Execution",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Design a Distributed Task Scheduler system (like Celery or Apache Airflow) that executes background jobs, cron tasks, and delayed tasks reliably with at-least-once execution guarantees.",
    idealAnswer: `### 1. System Components
- Scheduler Node: Scans DB/Delay Queue for tasks due for execution.
- Delay Queue: Redis Sorted Set (ZSET keyed by execution Unix timestamp) or RabbitMQ Dead Letter Exchange.
- Task Broker / Execution Queue: Kafka / SQS queue holding actionable job payloads.
- Worker Pool: Worker nodes popping tasks, acquiring distributed lock (Redlock), executing job logic, and heartbeating status.

### 2. Reliability & Guarantees
- At-Least-Once Delivery: Task acknowledged only after worker completes job execution. If worker crashes, unacknowledged task is re-queued after timeout.
- Idempotency: Tasks designed to be idempotent on execution.`,
    source: "Celery / Airflow Design",
    tags: ["System Design", "Task Scheduler", "Distributed Systems", "Redis"],
    metadata: { category: "System Design", domain: "Background Processing" }
  },
  {
    topic: "System Design - Collaborative Editing",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Real-Time Collaborative Document Editor (like Google Docs or Figma). Compare Operational Transformation (OT) and Conflict-free Replicated Data Types (CRDTs).",
    idealAnswer: `### 1. Conflict Resolution Paradigm
- Operational Transformation (OT): Centralized approach. Server acts as single source of truth, transforming concurrent operations based on version revision vectors before broadcasting to clients. Used by Google Docs.
- CRDTs (Conflict-free Replicated Data Types): Decentralized approach. Operations or state structures are mathematically commutative and mergeable without central coordination. Used by Figma / Yjs.

### 2. Architecture & Communication
- WebSocket connection between Client and Document Server Node.
- Document state kept in memory on WebSocket node for fast mutation.
- Asynchronous snapshots persisted to S3/DynamoDB every 30 seconds alongside an append-only operation log.`,
    source: "Google Docs Architecture / CRDTs",
    tags: ["System Design", "Collaborative Editing", "OT", "CRDT", "WebSocket"],
    metadata: { category: "System Design", domain: "Real-Time Collaboration" }
  },
  {
    topic: "System Design - Networking & Edge",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Design an API Gateway microservice layer for a cloud backend handling JWT authentication, TLS termination, dynamic routing, rate limiting, and circuit breaking.",
    idealAnswer: `### 1. Core Functions
- Request Routing: Path-based (/api/v1/users -> User Service) and Header-based routing.
- Authentication: Validates JWT signature at gateway level before forwarding request to downstream microservices, passing normalized X-User-Id header.
- Resilience: Circuit Breaking (Envoy / Resilience4j pattern) to stop routing traffic to unhealthy downstream instances.
- TLS Termination: Handles HTTPS handshake at edge, talking unencrypted or mTLS internally.

### 2. Tech Stack
- Envoy Proxy / Kong (Nginx/Lua) / Spring Cloud Gateway. Distributed as auto-scaled stateless instances behind a Layer 4 Network Load Balancer (NLB).`,
    source: "Microservices Patterns",
    tags: ["System Design", "API Gateway", "JWT", "Microservices"],
    metadata: { category: "System Design", domain: "Networking" }
  },
  {
    topic: "System Design - High Concurrency E-Commerce",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Design a Flash Sale System handling 10,000 inventory items with 1 million users attempting to purchase simultaneously in under 60 seconds without overselling.",
    idealAnswer: `### 1. Key Challenges
- Database write lock contention on inventory table row.
- High peak concurrency traffic spikes crashing backend servers.

### 2. Architectural Solution
- Pre-load Inventory in Redis: Write atomic script in Redis using DECRBY inventory_key 1.
  - If returned value >= 0: Purchase intent approved. User assigned a token and redirected to checkout.
  - If returned value < 0: Flash sale sold out immediately. Return 409 Conflict without touching RDBMS.
- Async Order Creation: Token passed to Kafka topic. Asynchronous consumer pool processes order creation in controlled DB batch inserts.
- Static Page CDN Caching: Flash sale landing page served 100% statically from CDN.`,
    source: "Alibaba Double 11 / Flash Sale Architecture",
    tags: ["System Design", "Flash Sale", "Redis", "Kafka", "Concurrency"],
    metadata: { category: "System Design", domain: "High Concurrency E-Commerce" }
  },
  {
    topic: "System Design - Location-Based Services",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Design a Location-Based Service (like Yelp or Uber Nearby Drivers) to search points of interest within a 5km radius based on user's live GPS coordinates.",
    idealAnswer: `### 1. Spatial Indexing Schemes
- Geohash: Encodes latitude and longitude into alphanumeric string (e.g. 9q9hvy). Prefix length corresponds to grid precision (6 chars ~ 1.2km x 0.6km box).
- Google S2 Geometry / Quadtree: Hierarchical 2D space partition.

### 2. Data Storage & Query
- Storage: Redis Geo / PostGIS (PostgreSQL) / MongoDB spatial index.
- Query Flow:
  1. Convert user (lat, lng) to Geohash prefix.
  2. Query database for target Geohash cell and 8 surrounding adjacent neighbor cells (to fix edge boundary problems).
  3. Filter returned candidates using exact Haversine distance formula to match < 5km radius.`,
    source: "Uber Engineering / System Design",
    tags: ["System Design", "Geohash", "PostGIS", "Uber", "Location-Based"],
    metadata: { category: "System Design", domain: "Geo & Maps" }
  },

  // ==========================================
  // BEHAVIORAL - 16 Qs
  // ==========================================
  {
    topic: "Behavioral - Production Outages & Reliability",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Tell me about a time when a critical production system under your responsibility experienced a severe outage. How did you diagnose, mitigate, and conduct the post-mortem?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Core payment processing microservice started returning 500 errors during Black Friday traffic, causing a 15% drop in checkout conversion.
- Task: Act as Incident Commander, stabilize the service rapidly, restore payment processing, and communicate clearly with leadership.
- Action:
  1. Checked APM metrics (Datadog) and discovered connection pool exhaustion on the primary PostgreSQL database.
  2. Identified a recent deployment that introduced unindexed DB queries on user transactions.
  3. Immediately rolled back the deployment to the previous stable release and restarted connection pools to clear stuck threads.
  4. Authored a thorough Post-Mortem (Blameless Post-Mortem) detailing root cause, timeline, and corrective actions (adding query linter in CI, connection pooling circuit breaker).
- Result: System restored within 18 minutes. Zero data loss. Implemented automated query performance guardrails preventing similar incidents.`,
    source: "Behavioral Bank - STAR Framework",
    tags: ["Behavioral", "Incident Response", "Outage", "STAR"],
    metadata: { category: "Behavioral", competency: "Crisis Management & Accountability" }
  },
  {
    topic: "Behavioral - Technical Conflict & Resolution",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Describe a situation where you strongly disagreed with a senior architect or teammate regarding a technical design choice. How did you handle the discussion and reach consensus?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Senior architect proposed building a custom synchronous REST pipeline for cross-service events, whereas I favored an asynchronous event-driven model using Kafka for decoupling.
- Task: Address the architectural dispute professionally without creating team friction or delaying project milestones.
- Action:
  1. Requested a dedicated 1-on-1 technical review session.
  2. Avoided emotional arguments; instead created a comparative tradeoff matrix assessing latency, failure isolation, and operational maintenance cost.
  3. Built a quick 2-day proof-of-concept benchmark demonstrating service behavior under simulated network degradation.
  4. Proposed a compromise: REST for synchronous query endpoints and Kafka for async domain events.
- Result: Architect accepted the hybrid proposal. The service scaled seamlessly to 50k RPS with zero cascading failures across service boundaries.`,
    source: "Amazon Leadership Principles - Have Backbone; Disagree and Commit",
    tags: ["Behavioral", "Conflict Resolution", "Architecture", "Communication"],
    metadata: { category: "Behavioral", competency: "Collaboration & Technical Decision-Making" }
  },
  {
    topic: "Behavioral - Deadlines & Scope Negotiation",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Tell me about a project where business stakeholders set an aggressive or unrealistic deadline. How did you manage scope, communicate risks, and ensure on-time delivery?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Executive team requested an end-to-end data analytics export feature in 3 weeks for an enterprise client pitch, which engineering estimated at 7 weeks.
- Task: Balance business urgency with code quality, avoiding burnout and technical debt.
- Action:
  1. Met with the Product Manager to perform a MoSCoW prioritization (Must-have vs Should-have vs Could-have).
  2. Defined a tight Minimum Viable Product (MVP) focusing strictly on core CSV data exports while deferring customizable PDF reporting.
  3. Automated integration test coverage to ensure high speed didn't compromise system stability.
  4. Maintained transparent daily status updates on burndown charts.
- Result: Successfully delivered the MVP 2 days ahead of deadline. Client signed the contract, and Phase 2 features were delivered in subsequent sprints.`,
    source: "Behavioral Bank - Technical Project Management",
    tags: ["Behavioral", "Scope Negotiation", "Agile", "Stakeholder Management"],
    metadata: { category: "Behavioral", competency: "Execution & Prioritization" }
  },
  {
    topic: "Behavioral - Mistakes & Accountability",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Describe a mistake or bug you personally introduced to production. What happened, how did you respond, and what steps did you take to prevent recurrence?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Pushed a database migration script that missed an index on a high-cardinality foreign key column, causing slow DB queries and response latency spikes.
- Task: Take immediate ownership, resolve the regression, and establish safeguards.
- Action:
  1. Promptly alerted team on Slack #incident channel upon seeing latency metrics increase.
  2. Executed non-blocking concurrently indexed migration (CREATE INDEX CONCURRENTLY) directly in production DB to fix query performance.
  3. Owned responsibility during retro without shifting blame.
  4. Added automated PR checks in GitHub Actions utilizing pg-query-emscripten to verify all foreign keys are properly indexed before code merge.
- Result: Resolved within 25 minutes. Automated CI index checker caught 4 missing indices in subsequent developer PRs over the year.`,
    source: "Behavioral Bank - Ownership & Accountability",
    tags: ["Behavioral", "Ownership", "Mistakes", "Post-Mortem"],
    metadata: { category: "Behavioral", competency: "Accountability & Continuous Improvement" }
  },
  {
    topic: "Behavioral - Mentorship & Team Growth",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Tell me about a time you mentored a struggling teammate or junior engineer. How did you assess their challenges, provide feedback, and help them succeed?",
    idealAnswer: `### STAR Method Response Framework
- Situation: A junior developer was consistently missing sprint deliverables and expressing frustration with complex async TypeScript codebase mechanics.
- Task: Support their technical growth, boost their confidence, and help them meet sprint objectives independently.
- Action:
  1. Scheduled regular 1-on-1s and 30-minute daily pair-programming sessions.
  2. Broke large epic user stories down into smaller, actionable sub-tasks with clear acceptance criteria.
  3. Provided constructive PR reviews focusing on explaining why a pattern is preferred rather than just prescribing changes.
  4. Encouraged them to lead a technical demo during sprint showcase once their feature was completed.
- Result: Junior developer's velocity increased by 50% over 6 weeks and they successfully owned the next microservice integration independently.`,
    source: "Google Engineering Culture - Mentorship",
    tags: ["Behavioral", "Mentorship", "Leadership", "Teamwork"],
    metadata: { category: "Behavioral", competency: "People & Mentorship" }
  },
  {
    topic: "Behavioral - Technical Debt vs Product Delivery",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "How do you approach prioritizing technical debt refactoring against product features requested by business stakeholders?",
    idealAnswer: `### Approach & Strategy Framework
1. Translate Tech Debt to Business Impact: Express tech debt not as messy code, but in financial/business metrics—e.g. "This refactoring will reduce developer onboarding time by 20%, drop API error rates by 5%, and decrease cloud infrastructure costs by $2,000/month."
2. Fixed Capacity Allocation: Advocate for allocating 20% of every sprint's story points specifically for refactoring, dependency upgrades, and developer experience tools.
3. Boy Scout Rule: Require developers to refactor small code smells in modules they are already modifying for feature work ("Leave the campsite cleaner than you found it").
4. Tech Debt Backlog: Maintain a transparent, prioritized Tech Debt backlog with clear risk assessments reviewed quarterly with product management.`,
    source: "Engineering Management Best Practices",
    tags: ["Behavioral", "Technical Debt", "Refactoring", "Product Management"],
    metadata: { category: "Behavioral", competency: "Engineering Strategy" }
  },
  {
    topic: "Behavioral - Navigating Ambiguity",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Describe a project where requirements were vague or constantly evolving. How did you navigate ambiguity and turn high-level goals into concrete software?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Assigned to build a "Customer Health Score Engine" with vague requirements stating only that it should "flag churning users".
- Task: Define product requirements, architectural scope, and deliver a functional rating engine.
- Action:
  1. Interviewed key internal stakeholders across Customer Success, Product, and Sales to identify key churn indicators (login frequency, support ticket volume, API usage drop).
  2. Created a mathematical scoring formula prototype in Google Sheets and validated it against historical churn data.
  3. Authored an RFC document outlining data pipelines, API contracts, and user notification triggers.
  4. Iterated in 1-week feedback loops with working software demos.
- Result: Shipped Health Score dashboard on time. Successfully identified 80% of churning accounts 30 days prior to renewal.`,
    source: "Amazon Leadership Principles - Dealing with Ambiguity",
    tags: ["Behavioral", "Ambiguity", "Product Ownership", "RFC"],
    metadata: { category: "Behavioral", competency: "Problem Solving & Initiative" }
  },
  {
    topic: "Behavioral - Initiative & Proactive Engineering",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Tell me about a time you identified an engineering inefficiency or infrastructure problem that wasn't assigned to you, and took the initiative to fix it.",
    idealAnswer: `### STAR Method Response Framework
- Situation: CI/CD build pipeline was taking 35 minutes per PR, causing severe developer bottleneck and context switching.
- Task: Proactively optimize build times without sacrificing test coverage.
- Action:
  1. Analyzed build step timings and discovered un-cached Docker layer builds and sequential execution of unit and integration tests.
  2. Introduced GitHub Actions dependency caching for node_modules and Docker layer caching via BuildKit.
  3. Parallelized unit test runners across 4 runner nodes using Jest shard splitting.
- Result: Reduced CI build pipeline duration from 35 minutes to 6 minutes (83% speedup). Saved ~10 hours of developer wait time across the team daily.`,
    source: "Behavioral Bank - Bias for Action",
    tags: ["Behavioral", "Initiative", "DevOps", "CI/CD", "Optimization"],
    metadata: { category: "Behavioral", competency: "Bias for Action & Innovation" }
  },
  {
    topic: "Behavioral - Cross-Functional Collaboration",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Give an example of leading a project that required tight coordination across multiple cross-functional teams (e.g. Design, Data Science, Security, DevOps).",
    idealAnswer: `### STAR Method Response Framework
- Situation: Led the integration of OAuth2 Single Sign-On (SSO) and Multi-Factor Authentication (MFA) across Web, Mobile, Security, and Customer Support platforms.
- Task: Coordinate engineering deliverables across 4 separate engineering domains with zero downtime.
- Action:
  1. Established a shared OpenAPI contract specification before writing code.
  2. Hosted weekly cross-team syncs and set up a dedicated Slack channel for integration blocker resolution.
  3. Built a mock authentication server staging environment so frontend/mobile teams could build UI components concurrently while backend API was in progress.
  4. Scheduled a phased zero-downtime rollout with feature flags.
- Result: Successfully migrated 500,000 active users to SSO/MFA seamlessly with zero login outages.`,
    source: "Meta Behavioral Questions - Leadership",
    tags: ["Behavioral", "Cross-Functional", "Collaboration", "Security"],
    metadata: { category: "Behavioral", competency: "Cross-Functional Leadership" }
  },
  {
    topic: "Behavioral - Workload Management & Resilience",
    difficulty: QuestionDifficulty.EASY,
    prompt: "Describe a period when you faced multiple competing high-priority tasks and tight deadlines. How did you manage your workload and prevent burnout?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Simultaneously tasked with resolving an active security audit vulnerability, delivering a sprint feature, and assisting on a production incident response.
- Task: Manage competing priorities effectively while keeping stakeholders informed and preserving work quality.
- Action:
  1. Used the Eisenhower Matrix (Urgent vs Important) to rank tasks.
  2. Immediately escalated to Engineering Manager to re-prioritize non-critical sprint stories back to backlog.
  3. Focused 100% efforts on Security Vulnerability patch first, delegating incident log collection to an on-call teammate.
  4. Maintained clear communication on Slack regarding expected ETA for each item.
- Result: Mitigated security vulnerability within 4 hours, successfully resolved incident, and adjusted sprint goals with manager support without working unsustainable hours.`,
    source: "Behavioral Bank - Time Management",
    tags: ["Behavioral", "Time Management", "Prioritization", "Resilience"],
    metadata: { category: "Behavioral", competency: "Self-Management & Organization" }
  },
  {
    topic: "Behavioral - Tech Stack Advocacy & RFCs",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Tell me about a time you proposed introducing a major new technology, framework, or paradigm to your team's architecture. How did you gain buy-in?",
    idealAnswer: `### STAR Method Response Framework
- Situation: Monolithic REST API backend was struggling with complex mobile client requests, resulting in over-fetching data and high mobile payload latency. I proposed adopting GraphQL for mobile API aggregation.
- Task: Build consensus among skeptical senior engineers and obtain leadership approval.
- Action:
  1. Wrote a formal RFC (Request for Comments) detailing motivation, performance benchmarks, schema security, and migration roadmap.
  2. Conducted a 1-week Hackathon proof-of-concept integrating Apollo Server in a non-critical microservice.
  3. Demonstrated a 65% reduction in network payload size and faster mobile page render times during team tech talk.
  4. Outlined a low-risk phased migration path avoiding big-bang rewrites.
- Result: RFC was approved. Successfully adopted GraphQL across mobile APIs, improving app store user performance ratings significantly.`,
    source: "Behavioral Bank - Technical Influence",
    tags: ["Behavioral", "Tech Stack", "RFC", "Influence", "GraphQL"],
    metadata: { category: "Behavioral", competency: "Technical Leadership & Influence" }
  },
  {
    topic: "Behavioral - Customer Obsession & Feedback",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Describe a time you went above and beyond to address a customer pain point or incorporated direct customer feedback into an architectural decision.",
    idealAnswer: `### STAR Method Response Framework
- Situation: Enterprise customer reported that exporting monthly analytical reports (> 500,000 records) timed out their web browser with HTTP 504 Gateway Timeout errors.
- Task: Redesign export architecture to handle massive data volume reliably.
- Action:
  1. Replaced synchronous HTTP response generation with an asynchronous job queue.
  2. When user clicks Export, backend enqueues task in BullMQ / Redis, generates CSV file directly into AWS S3 using node streams, and emails a presigned download link to user.
  3. Added real-time progress bar UI via WebSockets.
- Result: Report generation handled up to 5,000,000 records effortlessly in background. Enterprise customer CSAT score reached 100%.`,
    source: "Amazon Leadership Principles - Customer Obsession",
    tags: ["Behavioral", "Customer Obsession", "Architecture", "Asynchronous"],
    metadata: { category: "Behavioral", competency: "Customer Focus" }
  },
  {
    topic: "Behavioral - Technical Pivots & Adaptability",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Tell me about a project where business priorities shifted mid-way through development, forcing a significant technical pivot. How did you adapt?",
    idealAnswer: `### STAR Method Response Framework
- Situation: After 4 weeks of developing a custom in-house authentication and user management microservice, company acquired a startup requiring unification under Okta Identity.
- Task: Pivot technical roadmap swiftly without wasting previous engineering investment.
- Action:
  1. Stayed positive and reframed team perspective on business strategy benefits.
  2. Audited existing codebase to salvage reusable domain logic (user profile DB schema, role-based permission middleware).
  3. Re-architected system to act as an abstraction layer over Okta SDK.
- Result: Completed Okta integration in 2 weeks (saving 3 weeks of custom auth dev time) and delivered unified authentication seamless user experience across both companies.`,
    source: "Behavioral Bank - Adaptability",
    tags: ["Behavioral", "Pivot", "Adaptability", "Agility"],
    metadata: { category: "Behavioral", competency: "Adaptability & Resilience" }
  },
  {
    topic: "Behavioral - Code Quality & Peer Reviews",
    difficulty: QuestionDifficulty.EASY,
    prompt: "What is your core philosophy on conducting effective code reviews? How do you ensure high code quality while fostering a collaborative, psychological safe environment?",
    idealAnswer: `### Code Review Philosophy & Best Practices
1. Empathy & Tone: Frame comments constructively ("What do you think about using X here?" rather than "Fix this bad code"). Separate the author from the code.
2. Categorize Feedback: Mark non-blocking suggestions clearly as nit: or suggestion: so authors know what must be changed vs what is optional.
3. Automate the Boring Stuff: Utilize ESLint, Prettier, and automated test pipelines for style and syntax checks, reserving human review time for architecture, correctness, and edge cases.
4. Praise Excellence: Leave positive comments on clever algorithms, clean abstractions, or thorough test coverage to reinforce positive engineering culture.`,
    source: "Google Engineering Practices - Code Review",
    tags: ["Behavioral", "Code Review", "Quality", "Culture"],
    metadata: { category: "Behavioral", competency: "Code Quality & Collaboration" }
  },
  {
    topic: "Behavioral - Pushing Back on Technical Requirements",
    difficulty: QuestionDifficulty.MEDIUM,
    prompt: "Describe a situation where you had to push back against a feature request from product managers because of security, architectural, or scalability concerns.",
    idealAnswer: `### STAR Method Response Framework
- Situation: Product manager requested storing user credit card numbers directly in our application database to enable a 1-click checkout feature for an upcoming promotion.
- Task: Educate product team on PCI-DSS security compliance risks and propose a compliant alternative.
- Action:
  1. Explained security & regulatory implications (PCI-DSS compliance cost, breach liability) clearly in non-jargon business terms.
  2. Researched and proposed Stripe Elements / Tokenization iframe integration, which allows 1-click checkout experience without sensitive card data ever touching our backend servers.
  3. Integrated Stripe Tokenization within 3 days.
- Result: Achieved 1-click checkout conversion increase while maintaining 100% PCI-DSS compliance and zero security exposure.`,
    source: "Behavioral Bank - Security & Pushback",
    tags: ["Behavioral", "Security", "Product Management", "Pushback"],
    metadata: { category: "Behavioral", competency: "Risk Management & Integrity" }
  },
  {
    topic: "Behavioral - Systems Performance Optimization",
    difficulty: QuestionDifficulty.HARD,
    prompt: "Tell me about a time you diagnosed and resolved a complex performance bottleneck in a distributed system.",
    idealAnswer: `### STAR Method Response Framework
- Situation: Core API dashboard endpoint response time degraded from 200ms to 4.5 seconds under high load.
- Task: Identify performance bottleneck, optimize throughput, and lower p99 response latencies below 300ms.
- Action:
  1. Used Distributed Tracing (Jaeger / Datadog APM) to trace flamegraphs across microservice boundaries.
  2. Discovered N+1 SQL query pattern fetching user profile metadata inside a loop.
  3. Refactored DB queries using SQL batch JOINs and added a Redis cache layer for user permission claims.
- Result: Reduced p99 response latency from 4.5s down to 140ms (97% reduction). Database CPU utilization dropped from 85% to 18%.`,
    source: "Behavioral Bank - Performance Tuning",
    tags: ["Behavioral", "Performance", "Optimization", "Database", "APM"],
    metadata: { category: "Behavioral", competency: "Deep Technical Expertise" }
  }
];

async function main() {
  console.log("🌱 Starting QuestionBank Seeding...");

  // Wipe existing questions to ensure clean idempotency
  const deleted = await prisma.questionBank.deleteMany({});
  console.log(`🧹 Cleaned ${deleted.count} existing QuestionBank entries.`);

  console.log(`📦 Seeding ${seedQuestions.length} curated questions across DSA, System Design, and Behavioral...`);

  let count = 0;
  for (const q of seedQuestions) {
    await prisma.questionBank.create({
      data: {
        topic: q.topic,
        difficulty: q.difficulty,
        prompt: q.prompt,
        idealAnswer: q.idealAnswer,
        source: q.source,
        tags: q.tags,
        metadata: q.metadata ?? {}
      }
    });
    count++;
  }

  console.log(`✅ Successfully seeded ${count} questions into QuestionBank!`);

  // Count breakdown by topic category
  const totalCount = await prisma.questionBank.count();
  console.log(`📊 Total QuestionBank records in DB: ${totalCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding QuestionBank:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

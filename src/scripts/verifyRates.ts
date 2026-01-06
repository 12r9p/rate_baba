import { calculateRateChange } from '../lib/rating';

console.log("=== Verifying Rating Logic ===");

// Case 1: First Game
// 1st place
const c1 = calculateRateChange(100, 1, null, true);
console.log(`Test 1 (1st Game, Rank 1): Expect 4. Got: ${c1}. Pass: ${c1 === 4}`);

// 3rd place
const c2 = calculateRateChange(100, 3, null, true);
console.log(`Test 2 (1st Game, Rank 3): Expect 2. Got: ${c2}. Pass: ${c2 === 2}`);

// Case 2: Standard Rate Change
// Prev: 4, Curr: 2 -> (4 - 2) * 8 = 16
const c3 = calculateRateChange(100, 2, 4, false);
console.log(`Test 3 (Prev 4, Curr 2): Expect 16. Got: ${c3}. Pass: ${c3 === 16}`);

// Prev: 2, Curr: 4 -> (2 - 4) * 8 = -16
const c4 = calculateRateChange(100, 4, 2, false);
console.log(`Test 4 (Prev 2, Curr 4): Expect -16. Got: ${c4}. Pass: ${c4 === -16}`);

// Case 3: Same Rank Bonus
// Prev: 2, Curr: 2 -> (2 - 2) * 8 + 10 = 10
const c5 = calculateRateChange(100, 2, 2, false);
console.log(`Test 5 (Same Rank 2): Expect 10. Got: ${c5}. Pass: ${c5 === 10}`);

// Case 4: High Rate Correction (>= 130)
// Prev: 4, Curr: 2. Base 16. Rate 130. Result -> 16 * 0.8 = 12.8 -> floor 12?
const c6 = calculateRateChange(130, 2, 4, false);
console.log(`Test 6 (High Rate 130, Base 16): Expect 12. Got: ${c6}. Pass: ${c6 === 12}`);

// Case 5: Low Rate Correction (<= 70)
// Prev: 4, Curr: 2. Base 16. Rate 70. Result -> 16 * 1.2 = 19.2 -> floor 19?
const c7 = calculateRateChange(70, 2, 4, false);
console.log(`Test 7 (Low Rate 70, Base 16): Expect 19. Got: ${c7}. Pass: ${c7 === 19}`);

// Check Negative Change with High Rate (Should NOT be corrected based on "acquired value" assumption?)
// Prev: 1, Curr: 2. Base -8.
const c8 = calculateRateChange(140, 2, 1, false);
console.log(`Test 8 (High Rate, Negative Base -8): Expect -8. Got: ${c8}. Pass: ${c8 === -8}`);


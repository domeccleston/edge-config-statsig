const FNV_PRIME_32 = 16_777_619n;
const FNV_OFFSET_32 = 2_166_136_261n;
/**
 * Much simplified version of https://github.com/sindresorhus/fnv1a
 * @see http://www.isthe.com/chongo/tech/comp/fnv/index.html
 * @see https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
 * @see https://softwareengineering.stackexchange.com/a/145633
 */
export function fnv1a(s: string): number {
  let hash = FNV_OFFSET_32;
  for (let i = 0; i < s.length; i++) {
    /* eslint-disable-next-line no-bitwise -- TODO: Fix ESLint Error (#13355) */
    hash ^= BigInt(s.charCodeAt(i));
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt/asUintN
    // Returns the value of bigint modulo 2^bits, as an unsigned integer.
    hash = BigInt.asUintN(32, hash * FNV_PRIME_32);
  }
  return Number(hash);
}

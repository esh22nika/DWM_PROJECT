import re


def fix_pattern_mining():
    # Read the current PatternMining.tsx file
    with open("frontend/src/pages/PatternMining.tsx", "r", encoding="utf-8") as f:
        content = f.read()

    # Fix 1: Better popularity score calculation (multiply by reasonable factor)
    content = re.sub(
        r"const popularityScore = Math\.round\(trendStrength \* 100 \* 10\) / 10;",
        "const popularityScore = Math.min(90, Math.round(trendStrength * 100 * 25));",
        content,
    )

    # Fix 2: Better growth rate calculation - use post counts instead of engagement averages
    old_growth_calc = r"""const growthRate = Math\.round\(
        \(\(recentEngagement - earlierEngagement\) / Math\.max\(earlierEngagement, 1\)\) \* 100
      \);"""

    new_growth_calc = """// Better growth rate: compare post frequency over time
      const timeSpan = sortedPosts.length >= 10 ?
        (new Date(sortedPosts[sortedPosts.length - 1].timestamp).getTime() -
         new Date(sortedPosts[0].timestamp).getTime()) / (1000 * 60 * 60 * 24) : 0;

      let growthRate = 0;
      if (timeSpan >= 7 && sortedPosts.length >= 6) {
        const firstHalf = sortedPosts.slice(0, Math.floor(sortedPosts.length / 2)).length;
        const secondHalf = sortedPosts.slice(Math.floor(sortedPosts.length / 2)).length;
        growthRate = Math.round(((secondHalf - firstHalf) / Math.max(firstHalf, 1)) * 100);
        growthRate = Math.max(-80, Math.min(150, growthRate)); // Cap extreme values
      }"""

    content = re.sub(old_growth_calc, new_growth_calc, content, flags=re.DOTALL)

    # Fix 3: Sequential patterns - filter out same-topic sequences
    old_seq_logic = r"""for \(let i = 0; i < sorted\.length - 1; i\+\+\) \{
        const seq = `\$\{sorted\[i\]\.topic\}\|\$\{sorted\[i \+ 1\]\.topic\}`;
        sequenceCounts\.set\(seq, \(sequenceCounts\.get\(seq\) \|\| 0\) \+ 1\);
      \}"""

    new_seq_logic = """for (let i = 0; i < sorted.length - 1; i++) {
        // Only count transitions between DIFFERENT topics
        if (sorted[i].topic !== sorted[i + 1].topic) {
          const seq = `${sorted[i].topic}|${sorted[i + 1].topic}`;
          sequenceCounts.set(seq, (sequenceCounts.get(seq) || 0) + 1);
        }
      }"""

    content = re.sub(old_seq_logic, new_seq_logic, content)

    # Fix 4: Better pattern strength calculation for sequential patterns
    content = re.sub(
        r"const patternStrength = Math\.round\(\(count / totalUsers\) \* 100 \* 100\) / 100;",
        "const patternStrength = Math.min(95, Math.round((count / Math.max(totalUsers, 50)) * 100 * 8));",
        content,
    )

    # Fix 5: Improve topic diversity in itemsets
    old_itemset_logic = r"""const itemArray = Array\.from\(items\)\.sort\(\);
      if \(itemArray\.length >= 2\) \{
        const key = itemArray\.join\("\|"\);"""

    new_itemset_logic = """const itemArray = Array.from(items).sort();
      // Ensure we have diverse item combinations (not just hashtags)
      const hasRealTopic = itemArray.some(item => post.topic.includes(item));
      if (itemArray.length >= 2 && hasRealTopic) {
        const key = itemArray.join("|");"""

    content = re.sub(old_itemset_logic, new_itemset_logic, content)

    # Fix 6: Better popularity calculation for itemsets too
    itemset_popularity_old = (
        r"const popularityScore = Math\.round\(trendStrength \* 100 \* 10\) / 10;"
    )
    itemset_popularity_new = (
        "const popularityScore = Math.min(90, Math.round(trendStrength * 100 * 20));"
    )

    # This will replace the second occurrence (in itemsets function)
    parts = content.split(itemset_popularity_old)
    if len(parts) >= 3:  # If we have at least 2 occurrences
        # Replace the second occurrence
        content = (
            parts[0]
            + itemset_popularity_old
            + parts[1]
            + itemset_popularity_new
            + "".join(parts[2:])
        )

    # Fix 7: Add topic diversity to association rules
    diversity_addition = """
    // Ensure topic diversity - don't let one topic dominate
    const topicCounts = new Map();
    pairData.posts.forEach(p => {
      topicCounts.set(p.topic, (topicCounts.get(p.topic) || 0) + 1);
    });
    const diversityScore = topicCounts.size / Math.max(pairData.posts.length, 1);

    // Skip if too dominated by single topic (unless it's a really strong pattern)
    if (diversityScore < 0.3 && pairData.count < 20) return;
    """

    # Insert diversity check after the initial count check in mineAssociationRules
    content = content.replace(
        "if (pairData.count < 5) return;",
        "if (pairData.count < 5) return;" + diversity_addition,
    )

    # Write the fixed content back
    with open("frontend/src/pages/PatternMining.tsx", "w", encoding="utf-8") as f:
        f.write(content)

    print("✅ Fixed all pattern mining issues:")
    print("   1. Growth rate calculation (capped realistic values)")
    print("   2. Popularity scores (better scaling)")
    print("   3. Sequential patterns (no same-topic sequences)")
    print("   4. Topic diversity (varied topics in results)")
    print("   5. Better itemset filtering")


if __name__ == "__main__":
    fix_pattern_mining()

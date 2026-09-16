# Research and training-bot design

These are original, simplified heuristic policies. Professional-player references describe inspiration, not measured replicas, endorsements, GTO accuracy, or evidence that traders share a poker style. Trading and crypto-market labels are fictional room personas. Exact range thresholds and mixing probabilities are implementation choices, not statistics taken from televised hands. Research used published strategy articles and match coverage, not a full video/hand-history dataset.

## Who each bot emulates

- **Maya — Risk manager:** Jason Koon-inspired discipline. Selective early entries, value aggression, restrained multiway bluffing. [Triton’s Koon–Tollerene heads-up coverage](https://tritonpokerseries.com/en-US/news/phenomenal-jason-koon-makes-it-11-after-emotional-heads-up-duel-with-mentor-ben-tollerene) discusses disciplined strategy execution. Its tournament context does not supply cash-game ranges; ours are design choices.
- **Leo — Volatility trader:** Blom-inspired attacking play. Wider late entries, more semi-bluffs, occasional larger bets. [PokerStars’ aggression lesson](https://www.pokerstars.com/poker/learn/news/aggressive-poker-plays-and-when-to-use-them/) discusses Blom and Dwan as aggressive examples and distinguishes calculated pressure from indiscriminate gambling.
- **Omar — Momentum trader:** Dwan-inspired pressure. Selected blocker re-raises, draws played aggressively and some late-street overbets. [PokerGO/PGT coverage](https://www.pgt.com/news/what-the-vlog-ingram-beats-durrrr-drum) references Dwan’s nine-high bluff against Phil Ivey. One spectacular hand is not a reliable estimate of bluff frequency.
- **Alex — Quant trader:** Polk-inspired bet sizing. Smaller bets on dry flops, larger value bets on wet boards and polarized overbet candidates. [Upswing’s sizing lesson](https://upswingpoker.com/bet-size-strategy-tips-rules/) includes hands analyzed by Doug Polk. We do not compute equilibrium ranges or verify nut-range advantage; overbet choices are simplified.
- **Nina — Selective pressure, solo only:** a six-max tight-aggressive composite based on [cash-game fundamentals](https://www.pokerstars.com/poker/learn/course/cash-games-course/). The friend occupies this seat in shared play and has no assigned bot policy.

## What changed in code

Position-sensitive opening thresholds; suited-connected playability; value re-raises and selected suited-ace blocker re-raises; effective-stack checks for speculative calls; sampled current made-hand comparisons; draw recognition; price-sensitive folds; less multiway bluffing; dry-flop continuation bets; variable pot fractions; occasional checks with value hands. Every returned action is bounded by the engine’s legal sizing and reopening rules.

Bots receive only their own cards, visible board, public chip contributions, position and public action log. They never inspect the actual deck or other hole cards. A small sample of possible opposing hands is used for relative made-hand strength, not full equity or inferred ranges. There is no adaptive player model or solver. Live coaching remains its separately labeled random-hand estimate.

## Gentler Omar setting

Omar now opens a narrower range, raises and bluffs less often, checks more strong hands, uses smaller postflop sizes, and requires an extra margin to call pressure. Overbets are rare. This reduces his pressure; it does not guarantee losses or change the shuffled cards, chip awards, or other bots.

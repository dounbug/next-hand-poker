# Next Hand · Macau After Hours

A crimson-and-black poker practice room with original lounge audio, two-player shared tables, and clear hand reviews. Play chips only; no payments or real-money wagering.

## Start a table

Requires Node.js 18 or newer. No dependencies or build step.

```sh
npm start
```

Open http://localhost:4173, choose a table name and select **Open a table**. Send the invite to a friend on the same network. Four house bots fill the remaining seats. Select **Start together** when both players have joined. Either player selects **Deal next hand** to continue; the previous result stays in Past hands.

On macOS, **Start Poker.command** also keeps the host awake while running. The host must remain online. For solo play, open http://localhost:4173/solo.

## At the table

- Fold, Call/Check and Raise/Bet sit directly beneath the table. Raise opens compact sizing controls; a separate confirmation places the wager.
- Hand info shows starting-hand percentile or current made-hand strength, with the comparison explained.
- Player reads summarize action. At hand end, a winner banner identifies pot recipients and all revealed hands are ranked, with folded hands labelled as comparisons.
- Overall play, what went well, decisions to revisit and street-by-street coaching stay visible. Coaching uses information available at each decision; it is heuristic guidance, not solver analysis.
- Sound and music are independent opt-in controls. The original synthesized score uses bass, sparse plucked melodies, brushed rhythm and room echo. A distinct chime signals your turn.

## Hosting and privacy

The Node server owns shared game state and validates actions. Opponent cards stay private until the hand ends, when all hands are revealed for learning. Private room saves and credentials are generated in `.local-private/`, which is excluded from Git and static serving. Restarted rooms resume paused. Browser storage holds the credential for reconnecting to that seat.

Same-network links cannot reach a friend on another network. The included `private-gateway.mjs` supports an optional HTTPS tunnel to loopback port 4174 while the game runs on port 4173. Start the game first so the private data directory exists, then run `node private-gateway.mjs`. The gateway generates a private invite key and requires an HTTPS invite to establish its secure access cookie. Configure your own tunnel and private invite; no tunnel, live keys, saved rooms or hosted instance configuration are included in this repository. Do not expose port 4173 directly to the internet.

Solo state is saved in that browser. Shared tables are saved on the host. Empty stacks refill between hands; blinds remain fixed at 10/20.

## Verify

```sh
npm test
```

Tests cover hand evaluation, legal betting, side pots, ties, chip conservation, multiplayer card privacy, reconnects, HTTP access, hand-strength comparisons, coaching, sizing controls and audio transitions. HTTP tests open temporary local ports.

## Live betting estimates

On your turn, Suggested play displays an estimated action, a legal size where appropriate, and the reason below the action controls. A browser worker samples 500 runouts using only your cards, the visible board and public chip contributions. It estimates your share of contestable pots against uniformly random opponent hands, including ties and side-pot eligibility, and compares it with the call price. It assumes showdown with no further betting. Position-sensitive starting-hand strength supports modest preflop raises. These are heuristics, not GTO or a model of opponents’ actual betting ranges. Suggestions never place bets automatically.

## Opponent styles and card odds

Card odds defaults to any suit and computes the chance of at least one matching rank among selected remaining board cards, without replacement. Choose a specific suit to narrow it to one card.

Click a bot’s style label for its behavior, professional-player inspiration and source. The policies use position, public betting, stack depth, draws and varied sizing; they are simplified heuristics and never use hidden opposing cards. See [research and design notes](BOT_STYLES.md). Trading labels are fictional personas, not claims about trader behavior.

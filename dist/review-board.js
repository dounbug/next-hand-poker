// Complete the saved shuffle only after the hand ends; never mutate the game.
export function reviewBoard(g){
 const board=[...g.board];
 if(g.street!=='complete'||board.length===5)return {board,hypothetical:false};
 if(![0,3,4].includes(board.length)||!Array.isArray(g.deck))return {board,hypothetical:false};
 const deck=[...g.deck],needed=board.length===0?8:board.length===3?4:2;
 if(deck.length<needed)return {board,hypothetical:false};
 while(board.length<5){deck.pop();const count=board.length===0?3:1;for(let i=0;i<count;i++)board.push(deck.pop());}
 return {board,hypothetical:true};
}

/**
 * Tic-Tac-Toe Game Command
 */

const games = new Map();

function renderBoard(board) {
  const symbols = board.map(cell => cell || '⬜');
  return `
${symbols[0]} | ${symbols[1]} | ${symbols[2]}
─────────
${symbols[3]} | ${symbols[4]} | ${symbols[5]}
─────────
${symbols[6]} | ${symbols[7]} | ${symbols[8]}
`.trim();
}

function checkWinner(board) {
  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of winLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'tie';
  }

  return null;
}

module.exports = {
  name: 'tictactoe',
  aliases: ['ttt'],
  category: 'fun',
  description: 'Play an interactive game of Tic-Tac-Toe with a friend or bot',
  usage: '{p}tictactoe [@opponent | move 1-9 | surrender]',
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, mentions, sender, message } = extra;
    const game = games.get(chat);

    // 1. Move input (1 to 9)
    if (args[0] && /^[1-9]$/.test(args[0])) {
      if (!game) {
        return await message.reply('❌ No active Tic-Tac-Toe game in this group. Start one with *!ttt @user*');
      }

      const move = parseInt(args[0], 10) - 1;
      const isPlayer1 = sender === game.p1;
      const isPlayer2 = sender === game.p2;

      if (!isPlayer1 && !isPlayer2) {
        return await message.reply('⚠️ You are not a player in this active game.');
      }

      const currentTurnUser = game.turn === '❌' ? game.p1 : game.p2;
      if (sender !== currentTurnUser) {
        return await message.reply(`⏳ It is not your turn! Waiting for @${currentTurnUser.split('@')[0]}`, {
          mentions: [currentTurnUser]
        });
      }

      if (game.board[move] !== null) {
        return await message.reply('⚠️ That space is already taken! Choose an empty spot (1-9).');
      }

      game.board[move] = game.turn;
      const winner = checkWinner(game.board);

      if (winner) {
        games.delete(chat);
        if (winner === 'tie') {
          return await sock.sendMessage(chat, {
            text: `🤝 *GAME TIED!*\n\n${renderBoard(game.board)}\n\nGood game! Nobody won.`
          }, { quoted: msg });
        }

        const winnerJid = winner === '❌' ? game.p1 : game.p2;
        return await sock.sendMessage(chat, {
          text: `🎉 *VICTORY!* @${winnerJid.split('@')[0]} (${winner}) won the game!\n\n${renderBoard(game.board)}`,
          mentions: [winnerJid]
        }, { quoted: msg });
      }

      // Switch turn
      game.turn = game.turn === '❌' ? '⭕' : '❌';
      const nextPlayer = game.turn === '❌' ? game.p1 : game.p2;

      return await sock.sendMessage(chat, {
        text: `🎮 *TIC-TAC-TOE*\n\n${renderBoard(game.board)}\n\nTurn: @${nextPlayer.split('@')[0]} (${game.turn})\nType *!ttt <1-9>* to make your move!`,
        mentions: [nextPlayer]
      }, { quoted: msg });
    }

    // 2. Surrender
    if (args[0] === 'surrender' || args[0] === 'giveup') {
      if (!game) return await message.reply('No active game to surrender.');
      games.delete(chat);
      return await message.reply(`🏳️ Game cancelled by @${sender.split('@')[0]}.`, { mentions: [sender] });
    }

    // 3. Start new game
    if (game) {
      return await message.reply('⚠️ A game is already in progress in this chat. Type *!ttt surrender* to end it.');
    }

    if (!mentions || mentions.length === 0) {
      return await message.reply('👥 Please mention an opponent to challenge!\nExample: *!ttt @user*');
    }

    const opponent = mentions[0];
    if (opponent === sender) {
      return await message.reply('❌ You cannot play against yourself!');
    }

    games.set(chat, {
      p1: sender,
      p2: opponent,
      turn: '❌',
      board: Array(9).fill(null)
    });

    const boardGuide = `
1️⃣ | 2️⃣ | 3️⃣
─────────
4️⃣ | 5️⃣ | 6️⃣
─────────
7️⃣ | 8️⃣ | 9️⃣
`.trim();

    await sock.sendMessage(chat, {
      text: `🎮 *TIC-TAC-TOE CHALLENGE!*\n\n• Player 1 (❌): @${sender.split('@')[0]}\n• Player 2 (⭕): @${opponent.split('@')[0]}\n\n*Positions:*\n${boardGuide}\n\n👉 @${sender.split('@')[0]}, it is your turn! Type *!ttt 1-9* to play.`,
      mentions: [sender, opponent]
    }, { quoted: msg });
  }
};

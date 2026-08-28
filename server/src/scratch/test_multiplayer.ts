import {
  generateRoomCode,
  generateInviteLink,
  verifyInviteToken,
} from '../utils/inviteLink';
import { multiplayerService } from '../controllers/multiplayer.service';
import {
  InvalidInviteTokenError,
  ExpiredInviteTokenError,
  AntiCheatError,
} from '../utils/errorResponse';

async function runEndToEndMultiplayerVerification() {
  console.log('=== STARTING MULTIPLAYER TYPING RACE SUBSYSTEM VERIFICATION ===\n');

  // Cryptographic Room Code & Signed Invite Tokens
  console.log('[Test 1] Generating Cryptographic Room Code and Signed Invite Link...');
  const roomCode = generateRoomCode();
  console.log(`Generated Room Code: ${roomCode}`);
  if (!roomCode.startsWith('RACE-') || roomCode.length !== 11) {
    throw new Error(`Invalid room code format: ${roomCode}`);
  }

  const { inviteLink, inviteToken } = generateInviteLink(roomCode);
  console.log(`Generated Invite Link: ${inviteLink}`);
  console.log(`Generated Invite Token: ${inviteToken.substring(0, 30)}...`);

  const payload = verifyInviteToken(roomCode, inviteToken);
  console.log(`Verified Token Payload: roomCode=${payload.roomCode}, expiresAt=${new Date(payload.expiresAt).toISOString()}`);

  try {
    const tamperedToken = inviteToken.substring(0, inviteToken.length - 2) + 'XX';
    verifyInviteToken(roomCode, tamperedToken);
    throw new Error('FAILED: Tampered token was accepted!');
  } catch (err: any) {
    if (err instanceof InvalidInviteTokenError) {
      console.log(`✓ Correctly rejected tampered token: ${err.message}`);
    } else {
      throw err;
    }
  }

  // Test expired token rejection
  try {
    const expiredToken = generateInviteLink(roomCode, -1).inviteToken;
    verifyInviteToken(roomCode, expiredToken);
    throw new Error('FAILED: Expired token was accepted!');
  } catch (err: any) {
    if (err instanceof ExpiredInviteTokenError) {
      console.log(`✓ Correctly rejected expired token: ${err.message}`);
    } else {
      throw err;
    }
  }

  console.log('\n[Test 2] Room Creation & Host Initialization...');
  const hostUser = { id: 'usr_host_001', username: 'SpeedDemon' };
  const { room, summary } = multiplayerService.createRoom(hostUser, 'socket_host_01', 5);

  console.log(`Room '${room.roomCode}' created. Status: ${room.status}, Max Capacity: ${room.maxCapacity}`);
  console.log(`Host User: ${summary.players[0]?.username} (isHost: ${summary.players[0]?.isHost})`);

  console.log('\n[Test 3] Admission Control & Join Approval Flow...');
  const player2 = { id: 'usr_player_002', username: 'KeyboardNinja' };
  const player3 = { id: 'usr_player_003', username: 'TyperPro' };


  const joinReq2 = multiplayerService.requestJoinRoom(room.roomCode, player2, 'socket_p2', room.inviteToken);
  console.log(`Player 2 ('${player2.username}') submitted join request. Pending approvals: ${joinReq2.room.approvalQueue.size}`);

  const approved2 = multiplayerService.approveJoinRequest(hostUser.id, room.roomCode, player2.id);
  console.log(`Host approved Player 2. Total active participants: ${approved2.room.players.size}`);


  multiplayerService.requestJoinRoom(room.roomCode, player3, 'socket_p3', room.inviteToken);
  const rejected3 = multiplayerService.rejectJoinRequest(hostUser.id, room.roomCode, player3.id, 'Room full of fast typers!');
  console.log(`Host rejected Player 3 with reason: '${rejected3.reason}'`);


  console.log('\n[Test 4] Synchronized 5-Second Countdown Initialization...');
  multiplayerService.toggleReady(player2.id, room.roomCode, true);

  await new Promise<void>((resolve) => {
    multiplayerService.startCountdown(
      hostUser.id,
      room.roomCode,
      (sec) => {
        console.log(`Countdown tick: ${sec}...`);
      },
      () => {
        console.log(`✓ Countdown reached 0! Race started. Status: ${multiplayerService.getRoom(room.roomCode)?.status}`);
        resolve();
      }
    );
  });

  console.log('\n[Test 5] Live Telemetry & Anti-Cheat Velocity Verification...');
  await new Promise((r) => setTimeout(r, 250));
  const prog1 = multiplayerService.processProgress(hostUser.id, room.roomCode, 5, 5);
  console.log(`Host progress: ${prog1.player.progressPercent}%, WPM: ${prog1.player.wpm}, Accuracy: ${prog1.player.accuracy}%`);

  try {
    multiplayerService.processProgress(player2.id, room.roomCode, 100, 100);
    throw new Error('FAILED: Anti-cheat did not catch rapid spoofed progress!');
  } catch (err: any) {
    if (err instanceof AntiCheatError) {
      console.log(`✓ Anti-cheat correctly flagged velocity anomaly: ${err.message}`);
    } else {
      throw err;
    }
  }

  // Complete race for host and player 2
  console.log('\n[Test 6] Race Completion & Leaderboard Finalization...');
  const charCount = room.characterCount;
  for (let idx = 10; idx < charCount; idx += 5) {
    await new Promise((r) => setTimeout(r, 250));
    multiplayerService.processProgress(hostUser.id, room.roomCode, idx, idx);
  }
  await new Promise((r) => setTimeout(r, 250));
  const finish1 = multiplayerService.processProgress(hostUser.id, room.roomCode, charCount, charCount);
  console.log(`Host finished! Rank: ${finish1.player.rank}, WPM: ${finish1.player.wpm}, Duration: ${finish1.player.finishTimeMs}ms`);

  for (let idx = 5; idx < charCount; idx += 5) {
    await new Promise((r) => setTimeout(r, 250));
    multiplayerService.processProgress(player2.id, room.roomCode, idx, idx);
  }
  await new Promise((r) => setTimeout(r, 250));
  const finish2 = multiplayerService.processProgress(player2.id, room.roomCode, charCount, charCount);
  console.log(`Player 2 finished! Rank: ${finish2.player.rank}, WPM: ${finish2.player.wpm}, Duration: ${finish2.player.finishTimeMs}ms`);

  const { leaderboard } = multiplayerService.completeRace(room.roomCode);
  console.log('\nFinal Match Leaderboard:');
  console.table(leaderboard);

  console.log('\n[Test 7] Disconnect & Host Reassignment Handling...');
  const newRoom = multiplayerService.createRoom(hostUser, 'socket_host_02', 5).room;
  multiplayerService.requestJoinRoom(newRoom.roomCode, player2, 'socket_p2_02');
  multiplayerService.approveJoinRequest(hostUser.id, newRoom.roomCode, player2.id);

  console.log(`Original Host: ${newRoom.hostUserId}`);
  const disconnectResult = multiplayerService.handleDisconnect('socket_host_02', hostUser.id);
  console.log(`Host disconnected! New Host Reassigned: ${disconnectResult.newHostUserId} (${disconnectResult.newHostUsername})`);

  multiplayerService.stopCleanupTimer();
  console.log('\n=== ALL MULTIPLAYER SUBSYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runEndToEndMultiplayerVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

import assert from 'node:assert';
import { test, describe } from 'node:test';
import { socketAuthMiddleware } from './authMiddleware';
import { env } from '../config/env.config';

describe('socketAuthMiddleware', () => {
  const createMockSocket = (handshakeOptions: {
    auth?: Record<string, any>;
    headers?: Record<string, any>;
    query?: Record<string, any>;
    id?: string;
  }) => {
    const socket: any = {
      id: handshakeOptions.id || 'socket_test_12345',
      handshake: {
        auth: handshakeOptions.auth || {},
        headers: handshakeOptions.headers || {},
        query: handshakeOptions.query || {},
        address: '127.0.0.1',
      },
      data: {},
    };
    return socket;
  };

  test('allows connection with env.MOCK_AUTH_TOKEN and assigns unique user ID per socket', () => {
    const socket1 = createMockSocket({
      id: 'socket_host_111',
      auth: { token: env.MOCK_AUTH_TOKEN },
    });

    const socket2 = createMockSocket({
      id: 'socket_player_222',
      auth: { token: env.MOCK_AUTH_TOKEN },
    });

    let err1: Error | undefined;
    let err2: Error | undefined;

    socketAuthMiddleware(socket1, (err) => { err1 = err; });
    socketAuthMiddleware(socket2, (err) => { err2 = err; });

    assert.strictEqual(err1, undefined);
    assert.strictEqual(err2, undefined);

    assert.ok(socket1.data.user);
    assert.ok(socket2.data.user);

    assert.strictEqual(socket1.data.userId, 'user_socket');
    assert.strictEqual(socket2.data.userId, 'user_socket');
    assert.notStrictEqual(socket1.id, socket2.id);

    // Verify distinct user object properties when socket IDs differ
    const socketA = createMockSocket({
      id: 'alpha_12345',
      auth: { token: env.MOCK_AUTH_TOKEN },
    });
    const socketB = createMockSocket({
      id: 'beta_67890',
      auth: { token: env.MOCK_AUTH_TOKEN },
    });
    socketAuthMiddleware(socketA, () => {});
    socketAuthMiddleware(socketB, () => {});

    assert.strictEqual(socketA.data.userId, 'user_alpha_');
    assert.strictEqual(socketB.data.userId, 'user_beta_6');
    assert.notStrictEqual(socketA.data.userId, socketB.data.userId);
  });

  test('allows connections with token starting with mock_token_ (e.g. mock_token_player1 & mock_token_player2)', () => {
    const socketHost = createMockSocket({
      id: 'socket_h1',
      auth: { token: 'mock_token_player1' },
    });

    const socketPlayer2 = createMockSocket({
      id: 'socket_p2',
      auth: { token: 'mock_token_player2' },
    });

    socketAuthMiddleware(socketHost, () => {});
    socketAuthMiddleware(socketPlayer2, () => {});

    assert.strictEqual(socketHost.data.userId, 'user_player1');
    assert.strictEqual(socketHost.data.username, 'User_player1');
    assert.strictEqual(socketHost.data.user?.id, 'user_player1');

    assert.strictEqual(socketPlayer2.data.userId, 'user_player2');
    assert.strictEqual(socketPlayer2.data.username, 'User_player2');
    assert.strictEqual(socketPlayer2.data.user?.id, 'user_player2');

    assert.notStrictEqual(socketHost.data.userId, socketPlayer2.data.userId);
  });

  test('allows explicit x-user-id and x-username header/auth identity overrides', () => {
    const socket = createMockSocket({
      id: 'socket_custom',
      headers: {
        'x-user-id': 'custom_host_99',
        'x-username': 'HostMaster',
      },
      auth: { token: env.MOCK_AUTH_TOKEN },
    });

    let nextErr: Error | undefined;
    socketAuthMiddleware(socket, (err) => { nextErr = err; });

    assert.strictEqual(nextErr, undefined);
    assert.strictEqual(socket.data.userId, 'custom_host_99');
    assert.strictEqual(socket.data.username, 'HostMaster');
    assert.strictEqual(socket.data.user?.id, 'custom_host_99');
    assert.strictEqual(socket.data.user?.username, 'HostMaster');
  });

  test('rejects connection with invalid token', () => {
    const socket = createMockSocket({
      id: 'socket_invalid',
      auth: { token: 'invalid_secret_token_abc' },
    });

    let nextErr: Error | undefined;
    socketAuthMiddleware(socket, (err) => { nextErr = err; });

    assert.ok(nextErr instanceof Error);
    assert.match(nextErr.message, /Authentication error/i);
    assert.strictEqual(socket.data.user, undefined);
  });
});

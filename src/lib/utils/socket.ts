// Socket.IO instance holder for custom server mode
let ioInstance: ReturnType<typeof import('socket.io').Server.prototype.of> | null = null;

interface MockIO {
  to: (...args: unknown[]) => MockIO;
  emit: (...args: unknown[]) => void;
  on: (...args: unknown[]) => void;
}

export const setIO = (io: typeof ioInstance) => {
  ioInstance = io;
};

export const getIO = (): typeof ioInstance | MockIO => {
  // Return mock IO for serverless environments where Socket.IO isn't available
  if (!ioInstance) {
    const mock: MockIO = {
      to: () => mock,
      emit: () => {},
      on: () => {},
    };
    return mock;
  }
  return ioInstance;
};

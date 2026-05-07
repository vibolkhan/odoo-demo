/**
 * Standardized Async State Model
 */

export const AsyncStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Creates an initial async state object
 */
export const createAsyncState = () => ({
  status: AsyncStatus.IDLE,
  error: null,
  lastUpdated: null,
});

/**
 * Wraps an async operation to automatically update the state
 * @param {Object} state - The async state object to update
 * @param {Function} fn - The async function to execute
 * @returns {Promise<any>}
 */
export async function runAsync(state, fn) {
  state.status = AsyncStatus.LOADING;
  state.error = null;

  try {
    const result = await fn();
    state.status = AsyncStatus.SUCCESS;
    state.lastUpdated = new Date().toISOString();
    return result;
  } catch (error) {
    state.status = AsyncStatus.ERROR;
    state.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

/**
 * Helper to check state status
 */
export const isIdle = (state) => state.status === AsyncStatus.IDLE;
export const isLoading = (state) => state.status === AsyncStatus.LOADING;
export const isSuccess = (state) => state.status === AsyncStatus.SUCCESS;
export const isError = (state) => state.status === AsyncStatus.ERROR;
export const isFinished = (state) => [AsyncStatus.SUCCESS, AsyncStatus.ERROR].includes(state.status);

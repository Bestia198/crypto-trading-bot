/**
 * Reinforcement Learning Agent Service
 * Implements Q-learning for cryptocurrency trading with state persistence
 */

export interface State {
  priceChange: number; // -100 to 100 (%)
  volatility: number; // 0-100 (%)
  rsi: number; // 0-100
  momentum: number; // -100 to 100
  trend: 'up' | 'down' | 'neutral';
}

export interface Action {
  type: 'BUY' | 'SELL' | 'HOLD';
  positionSize: number; // 0-100 (%)
}

export interface QTableEntry {
  state: string; // JSON stringified state
  action: string; // JSON stringified action
  qValue: number;
  visitCount: number;
  lastUpdated: Date;
}

export interface AgentState {
  agentId: number;
  userId: number;
  qTable: Map<string, number>; // key: state-action, value: Q-value
  learningRate: number; // 0.01-0.1
  discountFactor: number; // 0.9-0.99
  epsilon: number; // exploration rate 0-1
  totalReward: number;
  episodeCount: number;
  lastTradePrice: number;
  lastTradeAction: Action | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Discretize continuous state into discrete bins for Q-learning
 */
export function discretizeState(state: State): string {
  const bins = {
    priceChange: Math.floor(state.priceChange / 5) * 5, // 5% bins
    volatility: Math.floor(state.volatility / 10) * 10, // 10% bins
    rsi: Math.floor(state.rsi / 20) * 20, // 20 point bins
    momentum: Math.floor(state.momentum / 10) * 10, // 10 point bins
    trend: state.trend,
  };
  return JSON.stringify(bins);
}

/**
 * Calculate reward based on trade outcome
 */
export function calculateReward(
  entryPrice: number,
  exitPrice: number,
  action: Action,
  stopLoss: number,
  takeProfit: number
): number {
  const priceChange = ((exitPrice - entryPrice) / entryPrice) * 100;
  
  let reward = 0;

  if (action.type === 'BUY') {
    if (priceChange > takeProfit) {
      reward = 10; // Strong win
    } else if (priceChange > 0) {
      reward = 5; // Win
    } else if (priceChange > -stopLoss) {
      reward = -2; // Small loss
    } else {
      reward = -10; // Strong loss (hit stop-loss)
    }
  } else if (action.type === 'SELL') {
    if (priceChange < -takeProfit) {
      reward = 10; // Strong win
    } else if (priceChange < 0) {
      reward = 5; // Win
    } else if (priceChange < stopLoss) {
      reward = -2; // Small loss
    } else {
      reward = -10; // Strong loss
    }
  } else if (action.type === 'HOLD') {
    // Small reward for avoiding bad trades
    reward = Math.max(-1, Math.min(1, priceChange / 10));
  }

  // Adjust reward by position size
  return reward * (action.positionSize / 100);
}

/**
 * Select action using epsilon-greedy strategy
 */
export function selectAction(
  discreteState: string,
  qTable: Map<string, number>,
  epsilon: number,
  availableActions: Action[]
): Action {
  // Exploration: random action
  if (Math.random() < epsilon) {
    return availableActions[Math.floor(Math.random() * availableActions.length)];
  }

  // Exploitation: best known action
  let bestAction = availableActions[0];
  let bestQValue = -Infinity;

  for (const action of availableActions) {
    const key = `${discreteState}|${JSON.stringify(action)}`;
    const qValue = qTable.get(key) ?? 0;
    if (qValue > bestQValue) {
      bestQValue = qValue;
      bestAction = action;
    }
  }

  return bestAction;
}

/**
 * Update Q-value using Q-learning formula
 * Q(s,a) = Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]
 */
export function updateQValue(
  currentState: string,
  action: Action,
  reward: number,
  nextState: string,
  qTable: Map<string, number>,
  learningRate: number,
  discountFactor: number,
  availableActions: Action[]
): number {
  const currentKey = `${currentState}|${JSON.stringify(action)}`;
  const currentQValue = qTable.get(currentKey) ?? 0;

  // Find max Q-value for next state
  let maxNextQValue = -Infinity;
  for (const nextAction of availableActions) {
    const nextKey = `${nextState}|${JSON.stringify(nextAction)}`;
    const nextQValue = qTable.get(nextKey) ?? 0;
    maxNextQValue = Math.max(maxNextQValue, nextQValue);
  }

  if (maxNextQValue === -Infinity) maxNextQValue = 0;

  // Q-learning update
  const newQValue =
    currentQValue + learningRate * (reward + discountFactor * maxNextQValue - currentQValue);

  qTable.set(currentKey, newQValue);
  return newQValue;
}

/**
 * Decay epsilon over time (reduce exploration)
 */
export function decayEpsilon(epsilon: number, decayRate: number = 0.995): number {
  return Math.max(0.01, epsilon * decayRate); // Minimum 1% exploration
}

/**
 * Generate trading signal from RL agent
 */
export function generateRLSignal(
  state: State,
  agentState: AgentState,
  stopLoss: number = 2,
  takeProfit: number = 5
): {
  action: Action;
  confidence: number;
  reasoning: string;
} {
  const discreteState = discretizeState(state);

  const availableActions: Action[] = [
    { type: 'BUY', positionSize: 100 },
    { type: 'BUY', positionSize: 50 },
    { type: 'SELL', positionSize: 100 },
    { type: 'SELL', positionSize: 50 },
    { type: 'HOLD', positionSize: 0 },
  ];

  const action = selectAction(discreteState, agentState.qTable, agentState.epsilon, availableActions);

  // Calculate confidence based on Q-value
  const key = `${discreteState}|${JSON.stringify(action)}`;
  const qValue = agentState.qTable.get(key) ?? 0;
  const confidence = Math.min(100, Math.max(0, (qValue + 10) * 5)); // Normalize to 0-100

  let reasoning = `RL Agent Decision: ${action.type}`;
  if (action.positionSize > 0) {
    reasoning += ` with ${action.positionSize}% position size`;
  }
  reasoning += ` (Q-value: ${qValue.toFixed(2)}, Confidence: ${confidence.toFixed(1)}%)`;

  return { action, confidence, reasoning };
}

/**
 * Serialize Q-table for storage
 */
export function serializeQTable(qTable: Map<string, number>): Array<[string, number]> {
  return Array.from(qTable.entries());
}

/**
 * Deserialize Q-table from storage
 */
export function deserializeQTable(data: Array<[string, number]>): Map<string, number> {
  return new Map(data);
}

/**
 * Get agent statistics
 */
export function getAgentStats(agentState: AgentState): {
  totalReward: number;
  episodeCount: number;
  avgRewardPerEpisode: number;
  qTableSize: number;
  epsilon: number;
  learningRate: number;
} {
  return {
    totalReward: agentState.totalReward,
    episodeCount: agentState.episodeCount,
    avgRewardPerEpisode: agentState.episodeCount > 0 ? agentState.totalReward / agentState.episodeCount : 0,
    qTableSize: agentState.qTable.size,
    epsilon: agentState.epsilon,
    learningRate: agentState.learningRate,
  };
}

export const wealthComparatorAbi = [
  {
    type: 'function',
    inputs: [{ name: 'encryptedWealth', type: 'bytes', internalType: 'bytes' }],
    name: 'submitWealth',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'users', type: 'address[]', internalType: 'address[]' }],
    name: 'compareWealth',
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    name: 'wealthOf',
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'getRichestUser',
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  }
];
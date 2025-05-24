//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ConfidentialWealthComparator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const confidentialWealthComparatorAbi = [
  {
    type: 'function',
    inputs: [{ name: '_users', internalType: 'address[]', type: 'address[]' }],
    name: 'compareWealth',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'requestId', internalType: 'uint256', type: 'uint256' },
      { name: 'result', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'decryptionCallback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_requestId', internalType: 'uint256', type: 'uint256' }],
    name: 'getRichestUser',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_encryptedWealth', internalType: 'euint256', type: 'bytes32' }],
    name: 'submitWealth',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_encryptedWealth', internalType: 'bytes', type: 'bytes' }],
    name: 'submitWealth',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'wealthOf',
    outputs: [{ name: '', internalType: 'euint256', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      { name: 'requestId', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'RichestUserUpdated',
  },
  { type: 'error', inputs: [], name: 'InvalidInput' },
  {
    type: 'error',
    inputs: [{ name: 'requestId', internalType: 'uint256', type: 'uint256' }],
    name: 'RequestAlreadyFulfilled',
  },
  { type: 'error', inputs: [], name: 'UnauthorizedHandleAccess' },
] as const
